import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

interface Task {
  isHighlighted?: any;
  chargeCode: string;
  description?: string;
  endDate?: string;
  location?: string;
  resource?: string;
  scheduleDate?: string;
  startDate?: string;
  status: string;
  taskNumber?: string;
  userID?: string;
  wRnumber?: string;
}

interface ScheduleEntry {
  scheduleDate: string;
  tasks: Task[][];
}

@Injectable({
  providedIn: 'root'
})
export class AllApiServiceService {

  url: any = 'http://azscusinve001:5092/api/v1'
  url_two: any = 'http://azscusinve001:5092/api/'
  constructor(private https: HttpClient) { }

  // Create Request, All Calendar Api, Get, Modify, Create Task All Api

  get_data_create_request() {
    let httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'text/plain' }),
      withCredentials: true  // This should be inside the httpOptions object
    };

    return this.https.get(`${this.url}/workRequest/GET/NewWorkRequest`, { withCredentials: true })
  }

  submit_new_work_request(body: any) {
    let httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      withCredentials: true
    };

    return this.https.post(`${this.url}/workRequest/POST/WR_Submit`, body, httpOptions)

  }

  draft_new_work_request(body: any) {
    let httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      withCredentials: true
    };

    return this.https.post(`${this.url}/workRequest/POST/WR_Save_Draft`, body, httpOptions)

  }

  add_new_task_request(body: any) {
    let httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      withCredentials: true
    };

    return this.https.post(`${this.url}/workRequest/POST/AddTask`, body, httpOptions)

  }

  add_chargeCode(body: any) {
    let httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      withCredentials: true
    };

    return this.https.post(`${this.url}/workRequest/POST/RequestNewChargeCode`, body, httpOptions)
  }

  add_tool(body: any) {
    let httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      withCredentials: true
    };

    return this.https.post(`${this.url}/workRequest/POST/RequestNewTool`, body, httpOptions)
  }

  get_all_workrequest() {
    return this.https.get(`${this.url}/workRequest/GET/GetWorkRequestData`, { withCredentials: true })
  }

  get_workrequest_details(wr_number: any) {
    return this.https.get(`${this.url}/workRequest/GET/GetWorkReqDataWithWRNumber?WRnumber=${wr_number}`, { withCredentials: true })
  }

  get_taskrequest_details(task_id: any) {
    return this.https.get(`${this.url}/workRequest/GET/GetTaskDataWithTKNumber?Tasknumber=${task_id}`, { withCredentials: true })
  }

  get_list__workrequest_logentries(body: any) {

    let httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      withCredentials: true
    };
    return this.https.post(`${this.url}/workRequest/GET/LogEntry`, body, httpOptions)

  }

  modify_work_request(body: any) {

    let httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      withCredentials: true
    };

    return this.https.post(`${this.url}/workRequest/POST/ModifyRequest`, body, httpOptions)

  }

  modify_test_request(body: any) {

    let httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      withCredentials: true
    };

    return this.https.post(`${this.url}/workRequest/POST/ModifyTask`, body, httpOptions)

  }

  get_schedule_data_calendar(currentDate: any): Observable<ScheduleEntry[]> {

    let httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      withCredentials: true
    };
    return this.https.get<ScheduleEntry[]>(`${this.url}/Calendar/GET/GetScheduleData?MonthYear=${currentDate}`, httpOptions)

  }

  add_to_schedule_request(body: any) {

    let httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      withCredentials: true
    };

    return this.https.post(`${this.url}/Calendar/POST/AddToSchedule`, body, httpOptions)
  }

  drag_reschedule_request(body: any) {

    let httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      withCredentials: true
    };

    return this.https.post(`${this.url}/Calendar/POST/UpdateSchedule`, body, httpOptions)
  }

  task_detail_allUser_modal_get() {
    let httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      withCredentials: true
    };
    return this.https.get(`${this.url}/User/GET/AllUsers`, httpOptions)
  }

  assignUser_taskDetail(body: any) {
    let httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      withCredentials: true
    };
    return this.https.post(`${this.url}/User/POST/AddContact`, body, httpOptions)
  }

  addlog_taskDetail(body: any) {
    let httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      withCredentials: true
    };
    return this.https.post(`${this.url}/Audit/POST/AddLog`, body, httpOptions)
  }

  add_link_task(body: any) {
    let httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      withCredentials: true
    };
    return this.https.post(`${this.url}/workRequest/POST/AddLink`, body, httpOptions)
  }

  add_file_task(body: any) {
    let httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      withCredentials: true
    };
    return this.https.post(`${this.url}/UploadCenter/UploadFile`, body, httpOptions)
  }

  download_file(fileName: any) {
    return this.https.get(
      `${this.url}/DownloadCenter/DownloadFile?fileName=${fileName}`,
      {
        responseType: 'blob',
        withCredentials: true
      }
    );
  }
  
  
  // Tech Interface

  get_all_task_request() {
    return this.https.get(`${this.url}/TechInterface/GET/GetTestData`, { withCredentials: true })
  }

  get_task_list_byTaskNumber(taskID: any) {
    return this.https.get(`${this.url}/TechInterface/GET/GetTestDataByTaskID?TaskID=${taskID}`, { withCredentials: true })
  }

  tech_interface_startTest(body: any) {
    let httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      withCredentials: true
    };
    return this.https.post(`${this.url}/TechInterface/POST/StartTest`, body, httpOptions)
  }

  tech_interface_endTest(body: any) {
    let httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      withCredentials: true
    };
    return this.https.post(`${this.url}/TechInterface/POST/EndTest`, body, httpOptions)
  }

  tech_interface_editTest(body: any) {
    let httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      withCredentials: true
    };
    return this.https.post(`${this.url}/TechInterface/POST/EditTest`, body, httpOptions)
  }

  delete_contact_task(body: any) {
    let httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      withCredentials: true
    };
    return this.https.post(`${this.url}/workRequest/POST/DeleteTaskContact`, body, httpOptions)
  }

  delete_file_task(body: any) {
    let httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      withCredentials: true
    };
    return this.https.post(`${this.url}/workRequest/POST/DeleteTaskFile`, body, httpOptions)
  }

  delete_link_task(body: any) {
    let httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      withCredentials: true
    };
    return this.https.post(`${this.url}/workRequest/POST/DeleteTaskLinks`, body, httpOptions)
  }

  // Report 

  Get_Charge_Out() {
    return this.https.get(`${this.url}/Reports/GET/GetChargeOut`, { withCredentials: true })
  }

  // Rate Chart API 

  Get_all_rateChart_rate(currentyear: any) {
    return this.https.get(`${this.url_two}RateChart/GET/GetRateChart?Year=${currentyear}`, { withCredentials: true })
  }

  Get_all_resource_rateChart() {
    return this.https.get(`${this.url_two}RateChart/GET/GetResource`, { withCredentials: true })
  }

  Add_resource_rateChart(body: any) {
    let httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      withCredentials: true
    };
    return this.https.post(`${this.url_two}RateChart/POST/AddResource`, body, httpOptions)

  }

  update_resource_rateChart(body: any) {
    let httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      withCredentials: true
    };
    return this.https.post(`${this.url_two}RateChart/POST/UpdateRates`, body, httpOptions)
  }

  // Resource Page All APP 

  Get_all_resource() {
    return this.https.get(`${this.url}/Resource`, { withCredentials: true })
  }

  Get_all_resource_dropdown() {
    return this.https.get(`${this.url}/Resource/GET/GetResourceFormData`, { withCredentials: true })
  }

  delete_resource(resource_id: any) {
    let httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      withCredentials: true
    };
    return this.https.delete(`${this.url}/Resource/${resource_id}`, { withCredentials: true });
  }

  Add_new_resource(body: any) {
    let httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      withCredentials: true
    };
    return this.https.post(`${this.url}/Resource`, body, httpOptions)
  }

  get_resource_details(resource_id: any) {
    return this.https.get(`${this.url}/Resource/${resource_id}`, { withCredentials: true })
  }

  update_new_resource(body: any) {
    let httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      withCredentials: true
    };
    return this.https.put(`${this.url}/Resource`, body, httpOptions)
  }

  // Tools Page All API

  Get_all_Tool() {
    return this.https.get(`${this.url}/Tool`, { withCredentials: true })
  }

  // Get_all_resource_dropdown() {
  //   return this.https.get(`${this.url}/Resource/GET/GetResourceFormData`, { withCredentials: true })
  // }

  delete_Tool(Tool_id: any) {
    let httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      withCredentials: true
    };
    return this.https.delete(`${this.url}/Tool/${Tool_id}`, { withCredentials: true });
  }

  Add_new_Tool(body: any) {
    let httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      withCredentials: true
    };
    return this.https.post(`${this.url}/Tool`, body, httpOptions)
  }

  get_Tool_details(Tool_id: any) {
    return this.https.get(`${this.url}/Tool/${Tool_id}`, { withCredentials: true })
  }

  update_new_Tool(body: any) {
    let httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      withCredentials: true
    };
    return this.https.put(`${this.url}/Tool`, body, httpOptions)
  }

  // CostCenter Page All API

  Get_all_CostCenter() {
    return this.https.get(`${this.url}/CostCenter`, { withCredentials: true })
  }

  delete_costCenter(costCenterID: any) {
    let httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      withCredentials: true
    };
    return this.https.delete(`${this.url}/CostCenter/${costCenterID}`, { withCredentials: true });
  }

  Add_new_CostCenter(body: any) {
    let httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      withCredentials: true
    };
    return this.https.post(`${this.url}/CostCenter`, body, httpOptions)
  }

  update_costCenter(body: any) {
    let httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      withCredentials: true
    };
    return this.https.put(`${this.url}/CostCenter`, body, httpOptions)
  }

  // Facility Page All API

  Get_all_facility() {
    return this.https.get(`${this.url}/Facility`, { withCredentials: true })
  }

  delete_Facility(Facility_id: any) {
    let httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      withCredentials: true
    };
    return this.https.delete(`${this.url}/Facility/${Facility_id}`, { withCredentials: true });
  }

  Add_new_facility(body: any) {
    let httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      withCredentials: true
    };
    return this.https.post(`${this.url}/Facility`, body, httpOptions)
  }

  update_new_facility(body: any) {
    let httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      withCredentials: true
    };
    return this.https.put(`${this.url}/Facility`, body, httpOptions)
  }

  get_Facility_details(Facility_id: any) {
    return this.https.get(`${this.url}/Facility/${Facility_id}`, { withCredentials: true })
  }

  // User page all API 

  Get_all_User() {
    return this.https.get(`${this.url}/User`, { withCredentials: true })
  }

  delete_User(User_id: any) {
    let httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      withCredentials: true
    };
    return this.https.delete(`${this.url}/User/${User_id}`, { withCredentials: true });
  }

  Add_new_User(body: any) {
    let httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      withCredentials: true
    };
    return this.https.post(`${this.url}/User`, body, httpOptions)
  }

  update_new_User(body: any) {
    let httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      withCredentials: true
    };
    return this.https.put(`${this.url}/User`, body, httpOptions)
  }

  get_User_details(User_id: any) {
    return this.https.get(`${this.url}/User/${User_id}`, { withCredentials: true })
  }

}

