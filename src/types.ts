export interface StudentDetail {
  id?: string;
  _id?: string;
  name: string;
  age: string | number;
  grade: string;
  studentClass?: string;
  section: string;
  rollNo?: string;
  allergens?: string[];
  intakeScore?: number;
  planActive?: boolean;
  subscribedPlan?: string;
  planExpiryDate?: any;
}
