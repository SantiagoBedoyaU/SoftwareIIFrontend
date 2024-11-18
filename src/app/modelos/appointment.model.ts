export interface Procedure {
    description: string;
  }

export interface Appointment {
    id?: string;
    start_date?: string;
    end_date?: string;
    doctor_id?: string;
    doctor_name?: string;
    patient_id?: string;
    patient_name?: string;
    status?: number;
    procedures?: Procedure[];  
}