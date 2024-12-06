// attendance-report.model.ts
export interface AttendanceReport {
    attending_patients: number;
    'non-attending_patients': number;
    attendance_percentage: number;
    'non-attendance_percentage': number;
}

export interface WaitingTimeReport {
    average_per_day: Record<string, number>;
    days_with_max_waiting_time: string;
    days_with_min_waiting_time: string;
}

export interface UsersDNIReport {
    cc_users: number;
    ti_users: number;
    tp_users: number;
    cc_percentage: number;
    ti_percentage: number;
    tp_percentage: number;
}

export interface ConsultedDoctorsReport {
    doctors: Record<string, number>;
}