import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AppointmentService } from '../../../services/appointment.service';
import { SecurityService } from '../../../services/security.service';
import { Appointment } from '../../../modelos/appointment.model';

@Component({
  selector: 'app-consult-hours',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule
  ],
  templateUrl: './consult-hours.component.html',
  styleUrl: './consult-hours.component.css'
})
export class ConsultHoursComponent implements OnInit {
  fGroup: FormGroup = new FormGroup({});
  appointments: Appointment [] = [];
  doctorID = '';

  constructor(
    private fb: FormBuilder,
    private appointmentService: AppointmentService,
    private securityService: SecurityService

  ) { }

  ngOnInit(): void {
    this.buildForm();
    this.initDatepickers();
    this.loadDoctorId();
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


  // Consult the appointments
  searchAppointments(): void {
    console.log('Formulario:', this.fGroup.value); // Verifica los valores del formulario

    if (this.fGroup.valid) {
      const { startDate, endDate } = this.fGroup.value;

      console.log('Fechas ingresadas:', startDate, endDate); // Verifica las fechas ingresadas

      this.showModal('loadingModal');

      this.appointmentService.getAppointmentsByDoctor(startDate, endDate, this.doctorID).subscribe({
        next: (data) => {
          this.appointments = data;
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
                    console.log('Paciente', this.appointments[index].patient_name)
                  } else {
                    this.appointments[index].patient_name = 'Paciente no encontrado';
                  }
                },
                error: (err) => {
                  console.error('Error al obtener los datos del paciente', err)
                }
              })
            })
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

  // Show a modal
  showModal(modalId: string, message?: string): void {
    const modalElement = document.getElementById(modalId);
    if (modalElement) {
      const instance = M.Modal.getInstance(modalElement);
      if (message) {
        modalElement.querySelector('.modal-content p')!.textContent = message;
      }
      instance.open();
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
