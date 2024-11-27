export class UnavailableTime {
    id: string;
    start_date: string;
    end_date: string;
    doctor_id: string;
  
    constructor(id: string, start_date: string, end_date: string, doctor_id: string) {
      this.id = id;
      this.start_date = start_date;
      this.end_date = end_date;
      this.doctor_id = doctor_id;
    }
  }