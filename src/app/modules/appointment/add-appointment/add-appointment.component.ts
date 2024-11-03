import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AppointmentService } from '../../../services/appointment.service';
import { SecurityService } from '../../../services/security.service';
import M from 'materialize-css';
import { CommonModule } from '@angular/common';
import moment from 'moment';

@Component({
  selector: 'app-add-appointment',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './add-appointment.component.html',
  styleUrls: ['./add-appointment.component.css'],
  providers: [AppointmentService]
})

export class AddAppointmentComponent implements OnInit {
  fGroup: FormGroup = new FormGroup({});
  userData: { firstName: string; lastName: string; dni: string; email: string; } | undefined;
  doctors: { id: string; name: string; }[] = [];
  filteredDoctors: { id: string; name: string; }[] = [];
  minDate: string = '';

  constructor(
    private fb: FormBuilder,
    private appointmentService: AppointmentService,
    private securityService: SecurityService,
  ) { }

  ngOnInit(): void {
    this.buildForm();
    M.Modal.init(document.querySelectorAll('.modal')); // Inicializar todos los modales
    this.loadUserData();
    this.loadDoctors();
    this.setMinDate();
  }

  buildForm() {
    this.fGroup = this.fb.group({
      doctorId: ['', Validators.required],
      fechaHoraInicio: ['', Validators.required],
    });
  }

  loadUserData() {
    this.securityService.GetUserData().subscribe({
      next: (user) => {
        if (user) {
          this.userData = {
            firstName: user.first_name,
            lastName: user.last_name,
            dni: user.dni,
            email: user.email,
          };
          console.log('Datos del usuario cargados:', this.userData);
        }
      },
      error: (error: any) => {
        console.error('Error al cargar los datos del usuario:', error);
      }
    });
  }

  loadDoctors() {
    this.appointmentService.getDoctors().subscribe({
      next: (doctors) => {
        this.doctors = doctors.map((doc: any) => ({
          id: doc.dni,
          name: `${doc.first_name} ${doc.last_name}`,
        }));

        console.log('Lista de doctores cargada:', this.doctors);
        this.filteredDoctors = this.doctors;
      },
      error: (error: any) => {
        console.error('Error al cargar la lista de doctores:', error);
      }
    });
  }

  onConfirmAppointment(): void {
    if (this.fGroup.valid && this.userData) {
      const startDate = moment(this.fGroup.get('fechaHoraInicio')?.value);
      const now = moment();

      // Validación para evitar fechas pasadas
      if (startDate.isBefore(now)) {
        const invalidDateModal = M.Modal.getInstance(document.getElementById('invalidDateModal')!);
        invalidDateModal.open();
        this.fGroup.patchValue({ fechaHoraInicio: '' });
        return;
      }

      // Validación para evitar domingos
      if (startDate.day() === 0) {
        const sundayModal = M.Modal.getInstance(document.getElementById('sundayModal')!);
        sundayModal.open();
        this.fGroup.patchValue({ fechaHoraInicio: '' });
        return;
      }

      // Validación para evitar horas fuera del rango permitido (6:00 AM a 6:00 PM)
      const startHour = startDate.hour();
      if (startHour < 6 || startHour >= 18) {
        const timeRangeModal = M.Modal.getInstance(document.getElementById('timeRangeModal')!);
        timeRangeModal.open();
        this.fGroup.patchValue({ fechaHoraInicio: '' });
        return;
      }

      // Si todas las validaciones pasan, registrar la cita
      const appointmentData = {
        doctor_id: this.fGroup.get('doctorId')?.value,
        patient_id: this.userData.dni,
        start_date: startDate.toISOString(),
        status: 0
      };

      console.log('Datos de la cita enviados:', appointmentData);

      this.appointmentService.createAppointment(appointmentData).subscribe({
        next: () => {
          console.log('Cita registrada con éxito');
          const successModal = M.Modal.getInstance(document.getElementById('successModal')!);
          successModal.open();
          this.fGroup.reset();
          this.fGroup.patchValue({ doctorId: '' });
          this.setMinDate();
        },
        error: (error: any) => {
          console.error('Error al registrar la cita:', error);
          if (error.error) {
            console.error('Detalles del error:', error.error);
          }
        }
      });
    } else {
      console.log('Formulario inválido');
    }
  }

  setMinDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = ('0' + (today.getMonth() + 1)).slice(-2);
    const day = ('0' + today.getDate()).slice(-2);
    this.minDate = `${year}-${month}-${day}`;
  }
}
