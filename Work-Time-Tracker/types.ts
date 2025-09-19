export interface Project {
  id: number;
  name: string;
  client?: string;
  isActive: boolean;
}

export interface TimeEntry {
  id: number;
  userId: number;
  projectId: number;
  date: string; // DD-MM-YYYY
  durationMinutes: number;
  note?: string;
}
