import type { Course, CourseCategory, SemesterInfo, Weekday } from "../timetable/types";

export type CourseSort = "name" | "credits";

export interface CourseQuery {
  q?: string;
  categories?: CourseCategory[];
  departments?: string[];
  majors?: string[];
  professors?: string[];
  days?: Weekday[];
  startAfter?: string;
  endBefore?: string;
  minCredits?: number;
  maxCredits?: number;
  page?: number;
  size?: number;
  sort?: CourseSort;
}

export interface CoursePage {
  page: number;
  size: number;
  total: number;
  totalPages: number;
  courses: Course[];
}

export interface CatalogFilter {
  id: string;
  label: string;
  count: number;
}

export interface CatalogFilters {
  categories: CatalogFilter[];
  departments: CatalogFilter[];
  majors: CatalogFilter[];
  professors: CatalogFilter[];
  days: CatalogFilter[];
}

export interface CatalogMeta {
  semester: SemesterInfo;
  courseCount: number;
  filters: CatalogFilters;
}

export interface CourseCatalog {
  search(query: CourseQuery): Promise<CoursePage>;
  findById(id: string): Promise<Course | null>;
  meta(): Promise<CatalogMeta>;
}
