import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AppointmentService } from '../../../services/appointment.service';
import { SecurityService } from '../../../services/security.service';
import M from 'materialize-css';
import { CommonModule } from '@angular/common';
import moment from 'moment';
import { HttpErrorResponse } from '@angular/common/http';
import { UserModel } from '../../../modelos/user.model';
import { CalendarOptions, EventClickArg, EventInput } from '@fullcalendar/core/index.js';
import { UnavailableTimeService } from '../../../services/unavailable-time.service';
import { FullCalendarModule } from '@fullcalendar/angular';
import timeGridPlugin from '@fullcalendar/timegrid';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Appointment } from '../../../modelos/appointment.model';
import { forkJoin } from 'rxjs';
import { UnavailableTime } from '../../../modelos/unavaibale-times.model';

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
    private unavailableTimesService: UnavailableTimeService,
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

  searchUnavailableTimes(): void {
    this.hasSearchedUnavailableTimes = false;
    this.updateCalendarEvents([]);
    if (this.fGroup.invalid) {
      M.toast({ html: 'Por favor, complete todos los campos antes de continuar.', classes: 'red' });
      return;
    }

    const startDate = this.fGroup.get('startDate')?.value;
    const endDate = this.fGroup.get('endDate')?.value;
    const doctorId = this.fGroup.get('doctorId')?.value;

    console.log('Parámetros enviados al servicio:', { startDate, endDate, doctorId });
    const loadingModalInstance = M.Modal.getInstance(document.getElementById('loadingModal')!);
    loadingModalInstance.open();

    const unavailableTimes$ = this.unavailableTimesService.getUnavailableTimes(startDate, endDate, doctorId);
    const appointment$ = this.appointmentService.getAppointmentsByDoctor(startDate, endDate, doctorId);

    forkJoin([unavailableTimes$, appointment$]).subscribe({
      next: ([unavailableTimes, appointments]) => {
        console.log('Horarios no disponibles:', unavailableTimes);
        console.log('Citas del doctor:', appointments);

        // Crear eventos de horarios no disponibles
        // Crear eventos de horarios no disponibles
        const unavailableEvents = unavailableTimes.map((time) => ({
          id: time.id,
          title: 'No Disponible',
          start: this.formatDateToUTC(time.start_date),
          end: this.formatDateToUTC(time.end_date),
          backgroundColor: '#F44336',
          borderColor: '#F44336',
          textColor: '#FFFFFF',
        }));

        //Crear eventos de citas pendientes
        const appointmentEvents = appointments.filter((appointment) => appointment.status === 0).map((appointment) => ({
          id: `appointment-${appointment.id}`,
          title: 'No disponible',
          start: this.formatDateToUTC(appointment.start_date ?? ''),
          end: this.formatDateToUTC(appointment.end_date ?? ''),
          backgroundColor: '#F44336',
          borderColor: '#F44336',
          textColor: '#FFFFFF',
        }));

        const allTimes = this.generateTimeSlots(startDate, endDate);

        //Filtrar horarios disponibles
        const availableTimes = allTimes.filter((time) =>
          !unavailableTimes.some((unavailable) => {
            const unavailableStart = moment.utc(unavailable.start_date);
            const unavailableEnd = moment.utc(unavailable.end_date);
            return (
              moment.utc(time.start).isSameOrAfter(unavailableStart) &&
              moment.utc(time.start).isBefore(unavailableEnd)
            );
          }) &&
          !appointments.some((appointment) => {
            const appointmentStart = moment.utc(appointment.start_date);
            const appointmentEnd = moment.utc(appointment.end_date);
            return (
              moment.utc(time.start).isSameOrAfter(appointmentStart) &&
              moment.utc(time.start).isBefore(appointmentEnd)
            );
          })
        );

        // Crear eventos de horarios disponibles
        const availableEvents = availableTimes.map((time, index) => ({
          id: `available-${index}`,
          title: 'Disponible',
          start: time.start,
          end: time.end,
          backgroundColor: '#4CAF50',
          borderColor: '#4CAF50',
          textColor: '#FFFFFF',
        }));

        // Combinar eventos
        const events = [...unavailableEvents, ...appointmentEvents, ...availableEvents];

        console.log('Eventos generados para el calendario:', events);
        this.updateCalendarEvents(events);

        this.hasSearchedUnavailableTimes = true;
        loadingModalInstance.close();
      },
      error: (error) => {
        console.error('Error al obtener horarios no disponibles:', error);
        loadingModalInstance.close();
      },

    });
  }

  generateTimeSlots(startDate: string, endDate: string): { start: string; end: string }[] {
    const slots = [];
    const start = moment(startDate).startOf('day');
    const end = moment(endDate).endOf('day');

    while (start.isBefore(end)) {
      const slotStart = start.clone();
      const slotEnd = start.add(15, 'minutes');

      slots.push({
        start: slotStart.toISOString(),
        end: slotEnd.toISOString(),
      });
    }

    return slots;
  }

  isTimeInUnavailable(slot: { start: string, end: string }, unavailableTimes: UnavailableTime[]): boolean {
    return unavailableTimes.some((time) => {
      return moment(slot.start).isBetween(time.start_date, time.end_date, null, '[)') ||
        moment(slot.end).isBetween(time.start_date, time.end_date, null, '[)');
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
      aspectRatio: window.innerWidth > 768 ? 1.5 : 0.8,
      events: [],
      allDaySlot: false,
      slotMinTime: '06:00:00',
      slotMaxTime: '18:00:00',
      slotDuration: '00:15:00',
      slotLabelInterval: '00:15:00',
      eventClick: this.onEventClick.bind(this),
    };
  }

  onEventClick(info: EventClickArg): void {
    const event = info.event;

    // Validar que el evento sea de disponibilidad (color verde)
    if (event.backgroundColor !== '#4CAF50') {
      M.toast({ html: 'Solo se pueden seleccionar horarios disponibles.', classes: 'red' });
      return;
    }

    const clickedDate = moment.utc(event.start);
    const doctorId = this.fGroup.get('doctorId')?.value;
    const doctor = this.doctors.find(doc => doc.id === doctorId);

    if (!doctor) {
      M.toast({ html: 'Por favor, seleccione un doctor antes de continuar.', classes: 'red' });
      return;
    }

    if (!this.hasSearchedUnavailableTimes) {
      M.toast({ html: 'Por favor, busque horarios disponibles antes de continuar.', classes: 'red' });
      return;
    }

    if (clickedDate.hour() < 6 || clickedDate.hour() >= 18) {
      M.toast({ html: 'Seleccione una hora entre las 6:00 AM y las 6:00 PM UTC', classes: 'red' });
      return;
    }

    this.selectedDateTime = clickedDate.format('YYYY-MM-DD HH:mm');
    this.selectedDoctorId = doctor.id;
    this.selectedDoctorName = doctor.name;

    console.log('Datos seleccionados:', { selectedDateTime: this.selectedDateTime, selectedDoctorId: this.selectedDoctorId });

    const modalInstance = M.Modal.getInstance(document.getElementById('createAppointmentModal')!);
    modalInstance.open();
  }

  updateCalendarEvents(events: EventInput[]) {
    console.log('Eventos antes de actualizar:', this.calendarOptions.events);

    // Reemplazar completamente los eventos actuales con los nuevos
    this.calendarOptions = {
      ...this.calendarOptions,
      events: [...events],
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

        this.searchUnavailableTimes();

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
