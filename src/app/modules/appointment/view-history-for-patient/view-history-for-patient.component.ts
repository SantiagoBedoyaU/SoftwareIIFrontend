import { Component, OnInit } from '@angular/core';
import { AppointmentService } from '../../../services/appointment.service';
import { SecurityService } from '../../../services/security.service';
import { CommonModule } from '@angular/common';
import { Appointment } from '../../../modelos/appointment.model';
import M from 'materialize-css'; // Import Materialize for modals

@Component({
  selector: 'app-view-history-for-patient',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './view-history-for-patient.component.html',
  styleUrls: ['./view-history-for-patient.component.css']
})
export class ViewHistoryForPatientComponent implements OnInit {
  appointments: Appointment[] = [];
  selectedAppointment: Appointment | null = null;

  constructor(
    private appointmentService: AppointmentService,
    private securityService: SecurityService
  ) {}

  ngOnInit() {
    this.loadMyAppointments();
    M.Modal.init(document.querySelectorAll('.modal')); // Initialize Materialize modals
  }

  loadMyAppointments() {
    this.appointmentService.getMyHistory().subscribe(
      (appointments) => {
        this.appointments = appointments.filter((appt) => appt.status === 2);
  
        // Formatear las fechas antes de mostrarlas
        this.appointments.forEach((appt) => {
          appt.start_date = appt.start_date ? this.convertToLocalDateTime(appt.start_date) : '';
          appt.end_date = appt.end_date ? this.convertToLocalDateTime(appt.end_date) : '';
        });
  
        if (this.appointments.length === 0) {
          this.showNoAppointmentsModal(); // Mostrar modal si no hay citas
        }
  
        // Obtener el nombre del médico para cada cita
        this.appointments.forEach((appointment, index) => {
          this.securityService.getUserByDNI(appointment.doctor_id ?? '').subscribe({
            next: (doctorData) => {
              if (doctorData) {
                this.appointments[index].doctor_name = `${doctorData.first_name} ${doctorData.last_name}`;
              } else {
                this.appointments[index].doctor_name = 'Nombre no disponible';
              }
            },
            error: () => {
              this.appointments[index].doctor_name = 'Nombre no disponible';
            },
          });
        });
      },
      (error) => {
        console.error('Error al obtener mis citas:', error);
        this.appointments = [];
      }
    );
  }
  

  selectAppointment(appointment: Appointment) {
    this.selectedAppointment = appointment;
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
  
  
  
  showNoAppointmentsModal() {
    const modalElement = document.getElementById('noAppointmentsModal');
    if (modalElement) {
      const modalInstance = M.Modal.getInstance(modalElement);
      modalInstance.open();
    }
  }
}
