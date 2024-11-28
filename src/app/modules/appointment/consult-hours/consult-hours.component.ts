import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AppointmentService } from '../../../services/appointment.service';
import { SecurityService } from '../../../services/security.service';
import { Appointment } from '../../../modelos/appointment.model';
import { FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid'; // Importa el plugin de día
import timeGridPlugin from '@fullcalendar/timegrid'; // Importa el plugin de tiempo
import { UnavailableTime } from '../../../modelos/unavaibale-times.model';
import { UnavailableTimeService } from '../../../services/unavailable-time.service';
import { CalendarOptions, EventClickArg, EventInput } from '@fullcalendar/core/index.js';

interface MyExtendedProps {
  startTime: string; // Formato de tiempo esperado (puede ser 'string', 'Date', etc.)
  endTime: string;
}

@Component({
  selector: 'app-consult-hours',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    FullCalendarModule
  ],
  templateUrl: './consult-hours.component.html',
  styleUrl: './consult-hours.component.css'
})
export class ConsultHoursComponent implements OnInit {
  fGroup: FormGroup = new FormGroup({});
  appointments: Appointment[] = [];
  unavailableTimes: UnavailableTime[] = [];
  doctorID = '';
  calendarOptions: CalendarOptions = {};
  selectedUnavailableTime: UnavailableTime | null = null;

  constructor(
    private fb: FormBuilder,
    private appointmentService: AppointmentService,
    private securityService: SecurityService,
    private unavailableTimeService: UnavailableTimeService

  ) { }

  ngOnInit(): void {
    this.buildForm();
    this.initDatepickers();
    this.loadDoctorId();
    this.initializeCalendar();
    M.Modal.init(document.querySelectorAll('.modal'));
  }

  // Build the form
  buildForm(): void {
    this.fGroup = this.fb.group({
      startDate: ['', Validators.required],
      endDate: ['', Validators.required]
    });
  }

  // init the datepickers with the format yyyy-mm-dd
  initDatepickers(): void {
    const elems = document.querySelectorAll('.datepicker');

    elems.forEach((elem, index) => {
      const picker = M.Datepicker.init(elem, {
        format: 'yyyy-mm-dd',
        i18n: {
          cancel: 'Cancelar',
          clear: 'Limpiar',
          done: 'Aceptar',
          months: [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
          ],
          monthsShort: [
            'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
          ],
          weekdays: [
            'Domingo', 'Lunes', 'Martes', 'Miércoles',
            'Jueves', 'Viernes', 'Sábado'
          ],
          weekdaysShort: [
            'Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'
          ],
          weekdaysAbbrev: ['D', 'L', 'M', 'M', 'J', 'V', 'S']
        },
        onClose: () => {
          const selectedDate = (elem as HTMLInputElement).value;
          console.log('Fecha seleccionada:', selectedDate);

          if (index === 0) {
            this.fGroup.get('startDate')?.setValue(selectedDate); // Actualiza el campo de inicio
          } else {
            this.fGroup.get('endDate')?.setValue(selectedDate); // Actualiza el campo de fin
          }
        }
      });

      // Añadir evento de clic al ícono para abrir el calendario
      const icon = elem.parentElement?.querySelector('.date-icon');
      icon?.addEventListener('click', () => {
        picker.open(); // Abre el selector de fecha al hacer clic en el ícono
      });
    });
  }


  // Load the doctor ID
  loadDoctorId(): void {
    this.securityService.GetUserData().subscribe({
      next: (userData) => {
        this.doctorID = userData.dni ?? '';
        console.log('Doctor ID:', this.doctorID);
      },
      error: (err) =>
        console.error('Error al cargar el ID del doctor:', err)
    });
  }

  initializeCalendar(): void {
    this.calendarOptions = {
      initialView: 'dayGridMonth',
      plugins: [dayGridPlugin, timeGridPlugin], // Usa los plugins importados
      timeZone: 'UTC',
      events: this.getEvents(), // Asegúrate de que este método devuelva eventos correctamente
      eventClick: this.handleEventClick.bind(this) // Cambia dateClick a eventClick
    };
  }

  getEvents(): EventInput[] {
    const appointmentEvents = this.appointments.map(appt => ({
      id: appt.id?.toString(), // ID de la cita
      title: appt.patient_name || 'Paciente no disponible',
      start: this.formatDateToUTC(appt.start_date ?? ''), // Formato correcto de fecha
      end: this.formatDateToUTC(appt.end_date ?? ''),    // Formato correcto de fecha
      allDay: true
    }));

    const unavailableEvents = this.unavailableTimes.map(unavailable => ({
      id: unavailable.id, // Asegúrate de que el horario no disponible tenga un ID
      title: 'Horario No Disponible',
      start: this.formatDateToUTC(unavailable.start_date),
      end: this.formatDateToUTC(unavailable.end_date),
      allDay: true,
      color: 'red',
      extendedProps: {
        startTime: unavailable.start_date,
        endTime: unavailable.end_date
      }
    }));

    const allEvents = [...appointmentEvents, ...unavailableEvents];
    console.log('Eventos combinados (ajustados):', allEvents);
    return allEvents;
  }

  // Método auxiliar para formatear fechas a UTC sin milisegundos
  private formatDateToUTC(dateString: string | Date): string {
    const date = new Date(dateString);
    return date.toISOString().split('.')[0] + 'Z';
  }

  handleEventClick(info: EventClickArg) {
    console.log('Evento:', info.event);

    // Verifica si el título del evento es 'Horario No Disponible'
    if (info.event.title === 'Horario No Disponible') {
      // Obtiene las propiedades extendidas del evento
      const extendedProps = info.event.extendedProps as MyExtendedProps;

      // Actualiza selectedUnavailableTime con la información del evento
      this.selectedUnavailableTime = {
        id: info.event.id, // Asegúrate de que el evento tenga un ID
        start_date: extendedProps.startTime,
        end_date: extendedProps.endTime,
        doctor_id: this.doctorID
        // Agrega cualquier otra propiedad que necesites
      };

      // Formatea los horarios
      const { startTime, endTime } = this.getFormattedEventTimes(
        extendedProps.startTime,
        extendedProps.endTime
      );

      const message = `
        <strong>Horario No Disponible</strong><br>
        <strong>Horario de Inicio:</strong> ${startTime}<br>
        <strong>Horario de Fin:</strong> ${endTime}
      `;
      this.showModal('unavailableTimesModal', message);
    } else {
      const appointment = this.appointments.find(appt => appt.id === info.event.id);

      if (appointment) {
        const startTime = new Date(appointment.start_date ?? '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const endTime = new Date(appointment.end_date ?? '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const statusLabel = this.getStatusLabel(appointment.status ?? 0);

        const message = `
          <strong>Paciente:</strong> ${appointment.patient_name}<br>
          <strong>Horario de Inicio:</strong> ${startTime}<br>
          <strong>Horario de Fin:</strong> ${endTime}<br>
          <strong>Estado:</strong> ${statusLabel}
        `;

        this.showModal('appointmentDetailsModal', message);
      } else {
        alert('No se encontró la cita.');
      }
    }
  }
  // Utility para formatear horas
  private getFormattedEventTimes(startUTC: string | Date, endUTC: string | Date): { startTime: string, endTime: string } {
    const startTime = new Date(startUTC).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
    const endTime = new Date(endUTC).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
    return { startTime, endTime };
  }

  editUnavailableTime(): void {
    if (this.selectedUnavailableTime) {
      console.log('Editando:', this.selectedUnavailableTime);

      const updatedData: UnavailableTime = {
        ...this.selectedUnavailableTime,
        start_date: new Date(this.selectedUnavailableTime.start_date).toISOString(),
        end_date: new Date(this.selectedUnavailableTime.end_date).toISOString(),
        doctor_id: this.doctorID
      };

      this.unavailableTimeService.updateUnavailableTimes(this.selectedUnavailableTime.id, updatedData).subscribe({
        next: () => {
          alert('Horario editado con éxito.');
          // Recarga los horarios actualizados
          this.loadUnavailableTimes(
            this.fGroup.value.startDate,
            this.fGroup.value.endDate
          );
          this.closeModal('unavailableTimesModal');
        },
        error: (err) => {
          console.error('Error al editar el horario:', err);
          alert('Hubo un error al editar el horario.');
        }
      });
    }
  }


  // Método para eliminar el horario
  deleteUnavailableTime(): void {

    console.log('Eliminando:', this.selectedUnavailableTime);
    // Muestra el modal de confirmación
    const message = '¿Estás seguro de que deseas eliminar el horario seleccionado?';
    this.showModal('deleteConfirmationModal', message);

  }

  // Método que se llama al confirmar la eliminación
  confirmDelete(): void {
    if (this.selectedUnavailableTime) {
      console.log('id:', this.selectedUnavailableTime.id);

      this.unavailableTimeService.deleteUnavailableTimes(this.selectedUnavailableTime.id).subscribe({
        next: () => {
          this.showModal('successModal', 'Horario eliminado con éxito.');

          // Recarga los horarios actualizados
          this.loadUnavailableTimes(
            this.fGroup.value.startDate,
            this.fGroup.value.endDate
          );

          this.selectedUnavailableTime = null;

          // Cierra el modal de éxito después de un breve retraso
          setTimeout(() => {
            this.closeModal('successModal');
            this.closeModal('unavailableTimesModal');
            this.closeModal('deleteConfirmationModal');
          }, 2000); // 2000 ms = 2 segundos
        },
        error: (err) => {
          console.error('Error al eliminar el horario:', err);
          alert('Hubo un error al eliminar el horario.');
        }
      });
    }
  }

  searchAppointments(): void {
    console.log('Formulario:', this.fGroup.value); // Verifica los valores del formulario

    if (this.fGroup.valid) {
      const { startDate, endDate } = this.fGroup.value;

      console.log('Fechas ingresadas:', startDate, endDate);

      // Validar el formato de las fechas (yyyy-mm-dd)
      const dateRegex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;
      if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
        // Si el formato es incorrecto, mostrar el modal de error
        this.showModal('validationErrorModal', 'El formato de la fecha es incorrecto');
        return; // Detener la ejecución del método
      }

      if (new Date(startDate) > new Date(endDate)) {
        this.showModal('validationErrorModal', 'La fecha de inicio no puede ser mayor a la fecha de fin.');
        return;
      }

      this.showModal('loadingModal');

      this.appointmentService.getAppointmentsByDoctor(startDate, endDate, this.doctorID).subscribe({
        next: (data) => {
          this.appointments = data;
          this.loadUnavailableTimes(startDate, endDate);
          console.log('Citas obtenidas:', this.appointments);
          this.closeModal('loadingModal');

          if (this.appointments.length === 0) {
            this.showModal('errorModal', 'No se encontraron citas en las fechas seleccionadas.');
          } else {
            this.appointments.forEach((appt, index) => {
              this.securityService.getUserByDNI(appt.patient_id ?? "").subscribe({
                next: (userData) => {
                  if (userData) {
                    this.appointments[index].patient_name = `${userData.first_name} ${userData.last_name}`;
                    console.log('Paciente', this.appointments[index].patient_name);
                  } else {
                    this.appointments[index].patient_name = 'Paciente no encontrado';
                  }

                  // Actualiza el calendario después de obtener todos los datos de pacientes
                  if (index === this.appointments.length - 1) {
                    this.updateCalendarEvents();
                  }
                },
                error: (err) => {
                  console.error('Error al obtener los datos del paciente', err);
                }
              });
            });
          }
        },
        error: (err) => {
          console.error('Error al obtener las citas:', err);
          this.closeModal('loadingModal');
          this.showModal('errorModal');
        }
      });
    } else {
      console.warn('Formulario inválido'); // Verifica si el formulario es inválido
      this.showModal('validationErrorModal', 'Por favor ingrese fechas válidas.');
    }
  }

  // Método para cargar los horarios no disponibles
  loadUnavailableTimes(startDate: string, endDate: string): void {
    this.unavailableTimeService.getUnavailableTimes(startDate, endDate, this.doctorID).subscribe({
      next: (data) => {
        this.unavailableTimes = data;
        console.log('Horarios no disponibles:', this.unavailableTimes);
        this.updateCalendarEvents(); // Actualiza el calendario después de cargar los horarios no disponibles
      },
      error: (err) => {
        console.error('Error al obtener los horarios no disponibles:', err);
      }
    });
  }

  updateCalendarEvents(): void {
    this.calendarOptions.events = this.getEvents(); // Actualiza los eventos
  }
  showModal(modalId: string, message?: string): void {
    const modalElement = document.getElementById(modalId);
    if (modalElement) {
      const instance = M.Modal.getInstance(modalElement);
      if (message) {
        const contentElement = modalElement.querySelector('.modal-content p')!;
        contentElement.innerHTML = message; // Cambia textContent a innerHTML para permitir HTML
      }
      instance.open();
    } else {
      console.error(`Modal con ID ${modalId} no encontrado.`);
    }
  }


  // Close a modal
  closeModal(modalId: string): void {
    const modalElement = document.getElementById(modalId);
    if (modalElement) {
      const instance = M.Modal.getInstance(modalElement);
      instance.close();
    }
  }

  // Get the status label
  getStatusLabel(status: number): string {
    switch (status) {
      case 0: return 'Pendiente';
      case 1: return 'Cancelada';
      case 2: return 'Completada';
      default: return 'Desconocido';
    }
  }


}