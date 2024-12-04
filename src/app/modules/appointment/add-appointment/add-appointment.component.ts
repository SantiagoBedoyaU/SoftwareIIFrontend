import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AppointmentService } from '../../../services/appointment.service';
import { SecurityService } from '../../../services/security.service';
import M from 'materialize-css';
import { CommonModule } from '@angular/common';
import moment from 'moment';
import { HttpErrorResponse } from '@angular/common/http';
import { UserModel } from '../../../modelos/user.model';
import { CalendarOptions, EventInput } from '@fullcalendar/core/index.js';
import { UnavailableTimeService } from '../../../services/unavailable-time.service';
import { FullCalendarModule } from '@fullcalendar/angular';
import timeGridPlugin from '@fullcalendar/timegrid';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction';
import { Appointment } from '../../../modelos/appointment.model';

@Component({
  selector: 'app-add-appointment',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    FullCalendarModule
  ],
  templateUrl: './add-appointment.component.html',
  styleUrls: ['./add-appointment.component.css'],
  providers: [AppointmentService]
})

export class AddAppointmentComponent implements OnInit {
  fGroup: FormGroup = new FormGroup({});
  userData: { firstName: string; lastName: string; dni: string; email: string; } | undefined;
  doctors: { id: string; name: string; }[] = [];
  filteredDoctors: { id: string; name: string; }[] = [];
  unavailableTimes: { start_date: string; end_date: string; }[] = [];
  minDate = '';
  calendarOptions: CalendarOptions = {};
  hasSearchedUnavailableTimes = false;

  selectedDateTime = '';
  selectedDoctorId = '';
  selectedDoctorName = '';

  constructor(
    private fb: FormBuilder,
    private appointmentService: AppointmentService,
    private securityService: SecurityService,
    private unavailableTimesService: UnavailableTimeService
  ) { }

  ngOnInit(): void {
    this.buildForm();
    M.Modal.init(document.querySelectorAll('.modal')); // Inicializar todos los modales
    this.loadUserData();
    this.loadDoctors();
    this.setMinDate();
    this.initializeCalendar();
  }

  buildForm() {
    this.fGroup = this.fb.group({
      doctorId: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
    });
  }

  loadUserData() {
    this.securityService.GetUserData().subscribe({
      next: (user) => {
        if (user) {
          this.userData = {
            firstName: user.first_name ?? '',
            lastName: user.last_name ?? '',
            dni: user.dni ?? '',
            email: user.email ?? '',
          };
          console.log('Datos del usuario cargados:', this.userData);
        }
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error al cargar los datos del usuario:', error);
      }
    });
  }

  loadDoctors() {
    this.appointmentService.getDoctors().subscribe({
      next: (doctors) => {
        this.doctors = doctors.map((doc: UserModel) => ({
          id: doc.dni ?? "",
          name: `${doc.first_name} ${doc.last_name}`,
        }));

        console.log('Lista de doctores cargada:', this.doctors);
        this.filteredDoctors = this.doctors;
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error al cargar la lista de doctores:', error);
      }
    });
  }

  searchUnavailableTimes() {
    if (this.fGroup.invalid) {
      M.toast({ html: 'Por favor, complete todos los campos antes de continuar.', classes: 'red' });
      return;
    }

    const startDate = this.fGroup.get('startDate')?.value;
    const endDate = this.fGroup.get('endDate')?.value;
    const doctorId = this.fGroup.get('doctorId')?.value;

    console.log('Parámetros enviados al servicio:', { startDate, endDate, doctorId });
    const loadingModalInstance = M.Modal.getInstance(document.getElementById('loadingModal')!);
    loadingModalInstance.open(); // Abre el modal de carga

    this.unavailableTimesService.getUnavailableTimes(startDate, endDate, doctorId).subscribe({
      next: (unavailableTimes) => {
        console.log('DATOS DEL BACKEND:', unavailableTimes);
        const events = unavailableTimes.map((time) => ({
          id: time.id,
          title: 'No Disponible',
          start: this.formatDateToUTC(time.start_date),
          end: this.formatDateToUTC(time.end_date),
          backgroundColor: '#FF0000',
          borderColor: '#FF0000',
          textColor: '#FFFFFF',
        }));

        console.log('Horarios no disponibles cargados:', events);
        this.updateCalendarEvents(events);
        this.hasSearchedUnavailableTimes = true;
        loadingModalInstance.close(); // Cierra el modal cuando los datos están listos
      },
      error: (error) => {
        console.error('Error al obtener horarios no disponibles:', error);
        loadingModalInstance.close(); // Cierra el modal incluso en caso de error
      },
    });
  }


  initializeCalendar(): void {
    this.calendarOptions = {
      timeZone: 'UTC',
      plugins: [timeGridPlugin, dayGridPlugin, interactionPlugin],
      initialView: 'timeGridWeek',
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'timeGridWeek,timeGridDay',
      },
      events: [],
      allDaySlot: false,
      slotMinTime: '06:00:00',
      slotMaxTime: '18:00:00',
      slotDuration: '00:30:00',
      slotLabelInterval: '00:30:00',
      dateClick: this.onDateClick.bind(this),
    };
  }

  onDateClick(info: DateClickArg): void {
    if (!this.hasSearchedUnavailableTimes) {
      M.toast({ html: 'Por favor, busque horarios disponibles antes de continuar.', classes: 'red' });
      return;
    }

    // Código existente
    const clickedDate = moment.utc(info.date);

    if (clickedDate.isBefore(moment.utc().startOf('day'))) {
      M.toast({ html: 'Las citas solo pueden asignarse a partir del día actual.', classes: 'red' });
      return;
    }

    if (clickedDate.hour() < 6 || clickedDate.hour() >= 18) {
      M.toast({ html: 'Seleccione una hora entre las 6:00 AM y las 6:00 PM UTC', classes: 'red' });
      return;
    }

    this.selectedDateTime = clickedDate.format('YYYY-MM-DD HH:mm');
    const doctor = this.doctors.find(doc => doc.id === this.fGroup.get('doctorId')?.value);
    if (!doctor) {
      M.toast({ html: 'Por favor, seleccione un doctor antes de continuar.', classes: 'red' });
      return;
    }

    this.selectedDoctorId = doctor.id;
    this.selectedDoctorName = doctor.name;

    const modalInstance = M.Modal.getInstance(document.getElementById('createAppointmentModal')!);
    modalInstance.open();
  }

  updateCalendarEvents(events: EventInput[]) {
    console.log('Eventos antes de actualizar:', this.calendarOptions.events);
  
    const existingEvents = Array.isArray(this.calendarOptions.events) ? this.calendarOptions.events : [];
    
    // Combinar eventos sin duplicados
    const combinedEvents = [...existingEvents, ...events].reduce((uniqueEvents, event) => {
      if (!uniqueEvents.some(e => e.id === event.id)) {
        uniqueEvents.push(event);
      }
      return uniqueEvents;
    }, [] as EventInput[]);
  
    this.calendarOptions = {
      ...this.calendarOptions,
      events: combinedEvents,
    };
  
    console.log('Eventos después de actualizar:', this.calendarOptions.events);
  }
  

  // Método para formatear fechas a UTC sin milisegundos
  private formatDateToUTC(dateString: string | Date): string {
    const date = new Date(dateString);
    return date.toISOString().split('.')[0] + 'Z';  // Asegúrate de que las fechas estén en formato UTC
  }

  onConfirmAppointment(): void {
    // Log para verificar el valor de la fecha seleccionada
    console.log('Fecha seleccionada (local):', this.selectedDateTime);
    
    // Convertir la fecha local a UTC
    const utcStartDate = moment(this.selectedDateTime).utcOffset(0, true).toISOString();
    console.log('Fecha enviada al backend (UTC):', utcStartDate);

    // Preparar los datos para la cita
    const appointmentData: Appointment = {
      doctor_id: this.selectedDoctorId,
      patient_id: this.userData?.dni,
      start_date: utcStartDate,
      status: 0,
    };

    console.log('Datos de la cita enviados:', appointmentData);

    // Llamar al servicio para crear la cita
    this.appointmentService.createAppointment(appointmentData).subscribe({
      next: () => {
        console.log('Cita registrada con éxito');
        M.toast({ html: 'Cita registrada con éxito', classes: 'green' });

        // Cerrar el modal
        const modalInstance = M.Modal.getInstance(document.getElementById('createAppointmentModal')!);
        modalInstance.close();

        // Asegurar que `events` es un array
        this.calendarOptions.events = Array.isArray(this.calendarOptions.events) ? this.calendarOptions.events : [];

        // Actualizar el calendario con el nuevo evento
        this.calendarOptions.events = [
          ...this.calendarOptions.events,
          {
            title: 'Cita',
            start: utcStartDate,
            backgroundColor: '#4CAF50',
            borderColor: '#4CAF50',
          },
        ];
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error al registrar la cita:', error);
        M.toast({ html: 'Error al registrar la cita', classes: 'red' });
      },
    });
  }


  setMinDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = ('0' + (today.getMonth() + 1)).slice(-2);
    const day = ('0' + today.getDate()).slice(-2);
    this.minDate = `${year}-${month}-${day}`;
  }
}
