import { Injectable } from '@angular/core';
import { json } from 'node:stream/consumers';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {

  constructor() { }

  // Save data to localStorage
  setDataFormCalender(data: any): void {
    localStorage.setItem('calendar_data', JSON.stringify(data));
  }

  // Get data from localStorage
  getDataFormCalender(): any {
    const data = localStorage.getItem('calendar_data');
    return data ? JSON.parse(data) : null;
  }
  
  setCalendarLocationCache(data: any): void {
    localStorage.setItem('locationCache', JSON.stringify(data));
  }
  
  getCalendarLocationCache(): any {
    const data = localStorage.getItem('locationCache');
    return data ? JSON.parse(data) : null;
  }
  

}
