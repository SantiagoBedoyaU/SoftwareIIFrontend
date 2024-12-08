import { Component, AfterViewInit } from '@angular/core';
import { AppointmentService } from '../../../services/appointment.service';
import { SecurityService } from '../../../services/security.service';
import { FormsModule } from '@angular/forms';
import { Appointment } from '../../../modelos/appointment.model';
import { CommonModule } from '@angular/common';
import { UserModel } from '../../../modelos/user.model';

declare const M: {
  Datepicker: {
    init: (elements: NodeListOf<Element>, options?: object) => void;
  };
  Modal: {
    init: (elements: NodeListOf<Element>) => void;
    getInstance: (element: Element) => unknown;
  };
};

@Component({
  selector: 'app-add-new-history',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './add-new-history.component.html',
  styleUrls: ['./add-new-history.component.css']
})

export class AddNewHistoryComponent implements AfterViewInit {
  dni = '';
  dniErrorMessage = '';
  patient: UserModel | null = null;
  appointments: Appointment[] = [];
  selectedAppointment: Appointment | null = null;
  typeOfConsultation = '';
  procedureDescription = '';
  realStartTime = '';

  constructor(
    private appointmentService: AppointmentService,
    private securityService: SecurityService
  ) { }

  ngAfterViewInit() {
    M.Datepicker.init(document.querySelectorAll('.datepicker'), {
      format: 'yyyy-MM-dd',
      autoClose: true,
      i18n: {
        cancel: 'Cancelar',
        done: 'Aceptar'
      }
    });

    M.Modal.init(document.querySelectorAll('.modal'));
  }

  convertToLocalDateTime(dateString: string): string {
    const utcDate = new Date(dateString); // Convertir cadena UTC a objeto Date
    const localDate = new Date(
      utcDate.getTime() + utcDate.getTimezoneOffset() * 60000
    ); // Convertir UTC a hora local

    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true, // Formato 12 horas
      timeZone: 'America/Bogota', // Asegurar la zona horaria correcta
    };

    return new Intl.DateTimeFormat('es-CO', options).format(localDate); // Combinar fecha y hora
  }


  validateDni() {
    // Validar que el DNI solo contenga números
    const dniPattern = /^[0-9]+$/;
    if (this.dni && !dniPattern.test(this.dni)) {
      this.dniErrorMessage = 'El DNI solo debe contener números.';
    } else {
      this.dniErrorMessage = '';
    }
  }

  searchPatient() {
    if (!this.dni) {
      // Mostrar modal de DNI no proporcionado
      const missingDniModal = M.Modal.getInstance(document.getElementById('missingDniModal')!) as { open: () => void };
      missingDniModal.open();
      return;
    }

    if (this.dniErrorMessage) {
      // No continuar si hay un mensaje de error en el DNI
      return;
    }

    this.securityService.GetUserData().subscribe(
      (userData) => {
        if (userData.role !== 1) {
          console.error('El usuario no tiene permisos para agregar una historia clínica');
          return;
        }

        this.securityService.getUserByDNI(this.dni).subscribe(
          (user) => {
            if (user) {
              this.patient = user;
              this.loadPendingAppointments();
            } else {
              // Mostrar modal de usuario no encontrado
              const userNotFoundModal = M.Modal.getInstance(document.getElementById('userNotFoundModal')!) as { open: () => void };
              userNotFoundModal.open();
              this.patient = null;
              this.appointments = [];
            }
          },
          (error) => {
            console.error('Error al buscar el paciente:', error);
            this.patient = null;
          }
        );
      },
      (error) => {
        console.error('Error al validar el rol del usuario:', error);
      }
    );
  }

  loadPendingAppointments() {
    const startDate = '2000-01-01';

    // Calcula la fecha de fin como el día actual más uno
    const today = new Date();
    today.setDate(today.getDate() + 1);
    const endDate = today.toISOString().split('T')[0]; // Formato YYYY-MM-DD

    this.securityService.GetUserData().subscribe(
      (userData) => {
        const doctorId = userData.dni;

        this.appointmentService.getAppointmentsByPatient(startDate, endDate, this.dni).subscribe(
          (appointments) => {
            // Filtra las citas y ajusta las fechas a la hora local
            this.appointments = appointments
              .filter((appt) => appt.status === 0 && appt.doctor_id === doctorId)
              .map((appt) => ({
                ...appt,
                formattedStartDate: appt.start_date ? this.convertToLocalDateTime(appt.start_date) : 'Fecha no disponible',
                formattedEndDate: appt.end_date ? this.convertToLocalDateTime(appt.end_date) : 'Fecha no disponible',
              }));

            // Mostrar modal si no hay citas pendientes
            if (this.appointments.length === 0) {
              const noAppointmentsModal = M.Modal.getInstance(
                document.getElementById('noAppointmentsModal')!
              ) as { open: () => void };
              noAppointmentsModal.open();
            }
          },
          (error) => {
            console.error('Error al obtener las citas:', error);
            this.appointments = [];
          }
        );
      },
      (error) => {
        console.error('Error al obtener los datos del usuario:', error);
      }
    );
  }



  selectAppointment(appointment: Appointment) {
    if (!appointment.procedures) {
      appointment.procedures = [];
    }
    this.selectedAppointment = appointment;
  }

  addProcedure() {
    if (!this.selectedAppointment) {
      console.error('No se ha seleccionado una cita');
      return;
    }

    const appointmentId = this.selectedAppointment.id;
    if (!appointmentId) {
      console.error('No se ha encontrado un ID de cita válido');
      return;
    }

    if (!this.typeOfConsultation.trim() || !this.procedureDescription.trim() || !this.realStartTime.trim()) {
      const emptyFieldsModal = M.Modal.getInstance(document.getElementById('emptyFieldsModal')!) as { open: () => void };
      emptyFieldsModal.open();
      return;
    }

    // Combinar la fecha de la cita con la hora ingresada por el usuario
    const startDate = this.selectedAppointment?.start_date;
    if (!startDate) {
      console.error('La cita seleccionada no tiene una fecha de inicio válida');
      return;
    }

    const appointmentDate = new Date(startDate); // Fecha base de la cita
    const [hours, minutes] = this.realStartTime.split(':'); // Separar la hora y los minutos

    // Ajustar la hora y los minutos ingresados
    appointmentDate.setHours(parseInt(hours, 10)); // Ajustar la hora local
    appointmentDate.setMinutes(parseInt(minutes, 10)); // Ajustar los minutos locales

    // Convertir la fecha y hora local a UTC antes de enviarla al backend
    const realStartDateTime = new Date(appointmentDate.getTime() - appointmentDate.getTimezoneOffset() * 60000).toISOString();

    // Crear el objeto de procedimiento con los campos requeridos
    const requestBody = {
      real_start_date: realStartDateTime, // La fecha y hora real en UTC
      procedure: {
        description: `${this.typeOfConsultation.trim()} - ${this.procedureDescription.trim()}`,
      },
    };

    // Enviar al backend
    this.appointmentService.addProcedure(appointmentId, requestBody).subscribe({
      next: () => {
        const successModal = M.Modal.getInstance(document.getElementById('successModal')!) as { open: () => void };
        successModal.open();
        this.clearFields();
      },
      error: (err) => {
        console.error('Error al agregar el procedimiento', err);
        alert('Hubo un error al agregar la historia clínica. Por favor intente de nuevo.');
      },
    });
  }


  clearFields() {
    this.dni = '';
    this.patient = null;
    this.appointments = [];
    this.selectedAppointment = null;
    this.typeOfConsultation = '';
    this.procedureDescription = '';
  }
}