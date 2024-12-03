import { Component, OnInit } from '@angular/core';
import { Chart, ChartConfiguration, ChartType, ChartTypeRegistry, registerables } from 'chart.js';
import { ReportService } from '../../../services/report.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AttendanceReport, WaitingTimeReport } from '../../../modelos/report.model';

interface BarChartData {
  data: number[];
  label: string;
}

Chart.register(...registerables); // Registra todos los elementos necesarios

@Component({
  selector: 'app-generate-reports',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule
  ],
  templateUrl: './generate-reports.component.html',
  styleUrl: './generate-reports.component.css'
})
export class GenerateReportsComponent implements OnInit {
  selectedReport = '';
  startDate = '';
  endDate = '';
  attendanceReport: AttendanceReport = {
    attending_patients: 0,
    'non-attending_patients': 0,
    attendance_percentage: 0,
    'non-attendance_percentage': 0,
  };
  waitingTimeReport?: WaitingTimeReport;
  formattedMaxWaitingDate = '';
  formattedMinWaitingDate = '';

  chartInstance: Chart<keyof ChartTypeRegistry, number[], string> | null = null;
  pieChartInstance: Chart<"pie"> | null = null;

  // Configuración de gráficas
  barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
  };

  barChartLabels: string[] = [];
  barChartData: BarChartData[] = [];
  barChartType: ChartType = 'bar';

  constructor(private reportService: ReportService) { }

  ngOnInit() {
    const modals = document.querySelectorAll('.modal');
    M.Modal.init(modals);
  }

  // Selección de reporte
  selectReport(type: string) {
    this.selectedReport = type;

    // Obtener la fecha actual en formato YYYY-MM-DD
    const currentDate = new Date().toISOString().split('T')[0];
    const endDateFormatted = new Date(this.endDate).toISOString().split('T')[0];

    // Si la fecha de fin es mayor o igual a la fecha actual, mostrar el modal de error
    if (endDateFormatted >= currentDate) {
      this.showModal('errorModal', 'La fecha de fin no puede ser mayor o igual a la fecha actual.');
      return;
    }

    // Destruír instancia previa de gráfico
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    if (type === 'attendance') {
      this.generateAttendanceReport();
    } else if (type === 'waitingTime') {
      this.generateWaitingTimeReport();
    }
  }

  generateAttendanceReport() {
    this.reportService.getAttendanceReport(this.startDate, this.endDate).subscribe(
      (data) => {
        this.attendanceReport = data;
        this.loadAttendanceChart(); // Genera la gráfica de barras
        this.loadAttendancePieChart(); // Genera la gráfica de torta
        console.log('Attendance report:', this.attendanceReport);
      },
      (error) => {
        console.error('Error fetching attendance report:', error);
      }
    );
  }


  generateWaitingTimeReport() {
    this.reportService.getWaitingTimeReport(this.startDate, this.endDate).subscribe(
      (data) => {
        this.waitingTimeReport = data;
        this.loadWaitingTimeChart();
        console.log('Waiting time report:', this.waitingTimeReport);

        const maxDate = new Date(this.waitingTimeReport.days_with_max_waiting_time).toISOString().split('T')[0];
        const minDate = new Date(this.waitingTimeReport.days_with_min_waiting_time).toISOString().split('T')[0];

        this.formattedMaxWaitingDate = maxDate.split('-').reverse().join('/');
        this.formattedMinWaitingDate = minDate.split('-').reverse().join('/');
      },
      (error) => {
        console.error('Error fetching waiting time report:', error);
      }
    );
  }

  loadAttendanceChart() {
    const attending = this.attendanceReport.attending_patients || 0;
    const nonAttending = this.attendanceReport['non-attending_patients'] || 0;
    const ctx = document.getElementById('reportChart') as HTMLCanvasElement;

    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    this.chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Asistencia', 'Inasistencia'],
        datasets: [
          {
            label: 'Pacientes',
            data: [attending, nonAttending],
            backgroundColor: ['rgba(54, 162, 235, 0.2)', 'rgba(255, 99, 132, 0.2)'],
            borderColor: ['rgba(54, 162, 235, 1)', 'rgba(255, 99, 132, 1)'],
            borderWidth: 1,
            barThickness: 40,
            maxBarThickness: 40,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 2, // Relación ancho/alto
        scales: {
          y: {
            beginAtZero: true,
          },
          x: {
            ticks: {
              maxRotation: 0, // Mantiene las etiquetas horizontales
            },
          },
        },
        plugins: {
          legend: {
            display: true,
          },
        },
      },
    });
  }


  loadAttendancePieChart() {
    const attendancePercentage = this.attendanceReport.attendance_percentage || 0;
    const nonAttendancePercentage = this.attendanceReport['non-attendance_percentage'] || 0;
    const pieCtx = document.getElementById('pieChart') as HTMLCanvasElement;

    if (this.pieChartInstance) {
      this.pieChartInstance.destroy();
    }

    this.pieChartInstance = new Chart(pieCtx, {
      type: 'pie',
      data: {
        labels: ['Asistencia (%)', 'Inasistencia (%)'],
        datasets: [
          {
            data: [attendancePercentage, nonAttendancePercentage],
            backgroundColor: ['rgba(75, 192, 192, 0.7)', 'rgba(255, 99, 132, 0.7)'],
            hoverBackgroundColor: ['rgba(75, 192, 192, 1)', 'rgba(255, 99, 132, 1)'],
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 1.5, // Relación ancho/alto para el gráfico de torta
        plugins: {
          tooltip: {
            callbacks: {
              label: (tooltipItem) => `${tooltipItem.label}: ${tooltipItem.raw}%`,
            },
          },
        },
      },
    });
  }

  loadWaitingTimeChart() {
    const ctx = document.getElementById('reportChart') as HTMLCanvasElement;

    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    // Datos del reporte
    const rawData = this.waitingTimeReport?.average_per_day ?? {};

    // Formatear las fechas
    const labels = Object.keys(rawData).map(date => {
      // Obtén la fecha exacta en UTC
      const exactDate = new Date(date).toISOString().split('T')[0];
      // Formatea la fecha en el formato deseado (ejemplo: "06/11/2024")
      return exactDate.split('-').reverse().join('/');
    });

    // Extraer valores y colores
    const values = Object.values(rawData).map(value => (value as number) || 0);
    const colors = values.map(value => (value >= 0 ? 'rgba(75, 192, 192, 0.7)' : 'rgba(60, 179, 113, 0.7)'));
    const borderColors = values.map(value => (value >= 0 ? 'rgba(75, 192, 192, 1)' : 'rgba(60, 179, 113, 1)'));

    // Determinar días con máximos y mínimos
    const maxWaitingDate = new Date(this.waitingTimeReport?.days_with_max_waiting_time ?? '').toISOString().split('T')[0];
    const minWaitingDate = new Date(this.waitingTimeReport?.days_with_min_waiting_time ?? '').toISOString().split('T')[0];

    // Formateo al estilo DD/MM/YYYY
    const formattedMaxWaitingDate = maxWaitingDate.split('-').reverse().join('/');
    const formattedMinWaitingDate = minWaitingDate.split('-').reverse().join('/');

    // Crear el gráfico
    this.chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            data: values,
            label: 'Tiempo de Espera (min)',
            backgroundColor: colors,
            borderColor: borderColors,
            borderWidth: 1,
            barThickness: 30,
            maxBarThickness: 30,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 2,
        scales: {
          y: {
            beginAtZero: false, // Permite valores negativos
            title: {
              display: true,
              text: 'Minutos',
              font: {
                size: 14,
              },
            },
          },
          x: {
            title: {
              display: true,
              text: 'Fechas',
              font: {
                size: 14,
              },
            },
          },
        },
        plugins: {
          legend: {
            display: true,
            labels: {
              font: {
                size: 12,
              },
            },
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.raw as number; // Conversión explícita
                return `${value.toFixed(2)} minutos`; // Personaliza el tooltip
              },
            },
          },
        },
      },
    });

    // Mostrar información adicional en la consola (opcional, ajusta según tus necesidades)
    console.log(`Día con tiempo máximo de espera: ${formattedMaxWaitingDate}`);
    console.log(`Día con tiempo mínimo de espera: ${formattedMinWaitingDate}`);
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

}