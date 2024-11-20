import { Component, AfterViewInit } from '@angular/core';
import { AppointmentService } from '../../../services/appointment.service';
import { SecurityService } from '../../../services/security.service';
import { FormsModule } from '@angular/forms';
import { Appointment } from '../../../modelos/appointment.model';
import { CommonModule } from '@angular/common';
import { UserModel } from '../../../modelos/user.model';

declare const M: {
  Modal: {
    init: (elements: NodeListOf<Element>) => void;
    getInstance: (element: Element) => { open: () => void; close: () => void };
  };
  Datepicker: {
    init: (elements: NodeListOf<Element>, options?: object) => void;
  };
};

@Component({
  selector: 'app-view-history-for-physician',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './view-history-for-physician.component.html',
  styleUrls: ['./view-history-for-physician.component.css']
})

export class ViewHistoryForPhysicianComponent implements AfterViewInit {
  dni = '';
  dniErrorMessage = '';
  patient: UserModel | null = null;
  appointments: Appointment[] = [];
  selectedAppointment: Appointment | null = null;

  constructor(
    private appointmentService: AppointmentService,
    private securityService: SecurityService
  ) { }

  ngAfterViewInit() {
    M.Modal.init(document.querySelectorAll('.modal'));
  }

  validateDni() {
    const dniPattern = /^[0-9]+$/;
    if (this.dni && !dniPattern.test(this.dni)) {
      this.dniErrorMessage = 'El DNI solo debe contener números.';
    } else {
      this.dniErrorMessage = '';
    }
  }

  searchPatient() {
    if (!this.dni) {
      const missingDniModal = M.Modal.getInstance(document.getElementById('missingDniModal')!);
      missingDniModal.open();
      return;
    }

    if (this.dniErrorMessage) {
      return;
    }

    this.securityService.getUserByDNI(this.dni).subscribe(
      (user) => {
        if (user) {
          this.patient = user;
          this.loadCompletedAppointments();
        } else {
          const userNotFoundModal = M.Modal.getInstance(document.getElementById('userNotFoundModal')!);
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
  }

  loadCompletedAppointments() {
    const startDate = '2000-01-01';
    
    // Calcula el día de hoy y añade un día para asegurarse de incluir el día completo
    const today = new Date();
    today.setDate(today.getDate() + 1);
    const endDate = today.toISOString().split('T')[0]; // Obtiene el formato YYYY-MM-DD

    this.appointmentService.getAppointmentsByPatient(startDate, endDate, this.dni).subscribe(
      (appointments) => {
        // Filtra las citas con el estado 2
        this.appointments = appointments.filter((appt) => appt.status === 2);

        if (this.appointments.length === 0) {
          const noAppointmentsModal = M.Modal.getInstance(document.getElementById('noAppointmentsModal')!) as { open: () => void };
          noAppointmentsModal.open();
          return;
        }

        // Obtener los nombres de los doctores para cada cita
        this.appointments.forEach((appointment, index) => {
          if (appointment.doctor_id) {
            this.securityService.getUserByDNI(appointment.doctor_id).subscribe({
              next: (doctorData) => {
                if (doctorData) {
                  this.appointments[index].doctor_name = `${doctorData.first_name} ${doctorData.last_name}`;
                } else {
                  this.appointments[index].doctor_name = 'Nombre no disponible';
                }
              },
              error: () => {
                this.appointments[index].doctor_name = 'Nombre no disponible';
              }
            });
          } else {
            this.appointments[index].doctor_name = 'Nombre no disponible';
          }
        });
      },
      (error) => {
        console.error('Error al obtener las citas:', error);
        this.appointments = [];
      }
    );
}


  selectAppointment(appointment: Appointment) {
    this.selectedAppointment = appointment;
    console.log('Selected Appointment:', this.selectedAppointment);
  }
}
