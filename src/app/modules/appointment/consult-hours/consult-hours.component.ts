import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, NgForm, ReactiveFormsModule, Validators } from '@angular/forms';
import { AppointmentService } from '../../../services/appointment.service';
import { SecurityService } from '../../../services/security.service';
import { Appointment } from '../../../modelos/appointment.model';
import { FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid'; // Importa el plugin de día
import timeGridPlugin from '@fullcalendar/timegrid'; // Importa el plugin de tiempo
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction'; // Importa el plugin de interacción
import { UnavailableTime } from '../../../modelos/unavaibale-times.model';
import { UnavailableTimeService } from '../../../services/unavailable-time.service';
import { CalendarOptions, EventClickArg, EventInput } from '@fullcalendar/core/index.js';

interface MyExtendedProps {
  startTime: string; // Formato de tiempo esperado (puede ser 'string', 'Date', etc.)
  endTime: string;
  patientName: string;
  status: number;
  startDate: string;
  endDate: string;
}

@Component({
  selector: 'app-consult-hours',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    FullCalendarModule,
    FormsModule
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
  selectedUnavailableTimeForCreate: UnavailableTime | null = null;
  selectedDate = '';

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

  // Initialize the calendar
  initializeCalendar(): void {
    this.calendarOptions = {
      initialView: 'dayGridMonth',
      plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin], // Usa los plugins importados
      timeZone: 'UTC',
      events: this.getEvents(), // Asegúrate de que este método devuelva eventos correctamente
      eventClick: this.handleEventClick.bind(this), // Cambia dateClick a eventClick
      dateClick: this.handleDateClick.bind(this)
    };
  }

  // Método para obtener los eventos del calendario
  getEvents(): EventInput[] {
    const appointmentEvents = this.appointments.map(appt => ({
      id: appt.id, // ID de la cita
      title: appt.patient_name || 'Paciente no disponible',
      start: this.formatDateToUTC(appt.start_date ?? ''), // Formato correcto de fecha
      end: this.formatDateToUTC(appt.end_date ?? ''),    // Formato correcto de fecha
      allDay: true,
      extendedProps: {
        patientName: appt.patient_name,
        startDate: appt.start_date,
        endDate: appt.end_date,
        status: appt.status
      }
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

  // Método para manejar el clic en un evento
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
      console.log('Procesando cita...');

      const extendedProps = info.event.extendedProps as MyExtendedProps;

      const startTime = new Date(extendedProps.startDate).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
      const endTime = new Date(extendedProps.endDate).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
      const statusLabel = this.getStatusLabel(extendedProps.status);

      const message = `
          <strong>Paciente:</strong> ${extendedProps.patientName}<br>
          <strong>Horario de Inicio:</strong> ${startTime}<br>
          <strong>Horario de Fin:</strong> ${endTime}<br>
          <strong>Estado:</strong> ${statusLabel}
        `;

      this.showModal('appointmentDetailsModal', message);
    } 
  }


  // Método para manejar el clic en una fecha
  handleDateClick(info: DateClickArg): void {
    this.selectedDate = info.dateStr; // Captura la fecha seleccionada
    const message = `Fecha seleccionada: ${this.selectedDate}. Por favor, ingrese el horario no disponible.`;
    this.showModal('addUnavailableTimeModal', message); // Muestra el mensaje en el modal
  }


  // Utility para formatear horas
  private getFormattedEventTimes(startUTC: string | Date, endUTC: string | Date): { startTime: string, endTime: string } {
    const startTime = new Date(startUTC).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
    const endTime = new Date(endUTC).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
    return { startTime, endTime };
  }

  editUnavailableTime(): void {
    // Muestra el modal de edición
    this.showModal('editUnavailableTimeModal');
  }

  // Método para actualizar horario no disponible
  saveUpdatedUnavailableTime(form: NgForm): void {
    if (form.valid && this.selectedUnavailableTime) {
      const updatedStartTime = `${this.selectedUnavailableTime.start_date.split('T')[0]}T${form.value.editStartTime}:00Z`;
      const updatedEndTime = `${this.selectedUnavailableTime.end_date.split('T')[0]}T${form.value.editEndTime}:00Z`;

      const updatedUnavailableTime: UnavailableTime = {
        id: this.selectedUnavailableTime.id,
        start_date: updatedStartTime,
        end_date: updatedEndTime,
        doctor_id: this.selectedUnavailableTime.doctor_id
      };

      console.log('Data sent to server:', updatedUnavailableTime);

      this.unavailableTimeService.updateUnavailableTimes(updatedUnavailableTime.id ?? '', updatedUnavailableTime).subscribe({
        next: (response) => {
          console.log('Horario no disponible actualizado:', response);
          this.showModal('successModal', 'Horario actualizado correctamente.');

          // Recarga los horarios actualizados en el calendario
          this.loadUnavailableTimes(
            this.fGroup.value.startDate,
            this.fGroup.value.endDate
          );

          // Limpiar selectedUnavailableTime después de la edición
          this.selectedUnavailableTime = null; // Limpiar la variable para evitar conflictos

          // Cierra los modales después de un breve retraso
          setTimeout(() => {
            this.closeModal('successModal');
            this.closeModal('editUnavailableTimeModal');
            this.closeModal('unavailableTimesModal');
          }, 2000); // 2 segundos
        },
        error: (err) => {
          console.error('Error al actualizar el horario:', err);
          M.toast({ html: 'Error al actualizar el horario no disponible' });
        }
      });
    } else {
      M.toast({ html: 'Por favor, completa todos los campos' });
    }
  }


  // Método para agregar un horario no disponible
  saveUnavailableTime(form: NgForm): void {
    if (form.valid && this.selectedDate) {
      console.log('Selected date:', this.selectedDate); // Depuración
      console.log('Start time:', form.value.startTime); // Debe ser solo hora
      const startTime = `${this.selectedDate}T${form.value.startTime}:00Z`;
      const endTime = `${this.selectedDate}T${form.value.endTime}:00Z`;

      console.log('Formatted Start Time:', startTime);
      console.log('Formatted End Time:', endTime);

      const newUnavailableTime: UnavailableTime = {
        start_date: startTime,
        end_date: endTime,
        doctor_id: this.doctorID
      };

      this.unavailableTimeService.createUnavailableTimes(newUnavailableTime).subscribe({
        next: () => {
          this.showModal('successModal', 'Horario agregado correctamente.');

          // Carga los eventos del rango actual para refrescar el calendario inmediatamente.
          this.loadUnavailableTimes(
            this.fGroup.value.startDate,
            this.fGroup.value.endDate
          );

          setTimeout(() => {
            this.closeModal('successModal');
            this.closeModal('addUnavailableTimeModal');
          }, 2000); // 2 segundos
        },
        error: (err) => {
          console.error('Error al agregar el horario:', err);
          console.log('Error:', err.error);
          M.toast({ html: 'Error al guardar el horario no disponible' });
        }
      });
    } else {
      M.toast({ html: 'Por favor, completa todos los campos' });
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

      this.unavailableTimeService.deleteUnavailableTimes(this.selectedUnavailableTime.id ?? '').subscribe({
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

  // Método para buscar citas
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

  // Método para actualizar los eventos del calendario
  updateCalendarEvents(): void {
    this.calendarOptions.events = this.getEvents(); // Actualiza los eventos
  }

  // Show a modal
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