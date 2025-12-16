import { RouterModule, Routes } from '@angular/router';
import { HeaderFoorterComponent } from './header-foorter/header-foorter.component';
import { NgModule } from '@angular/core';
import { HomeComponent } from './home/home.component';
import { WorkRequestFormComponent } from './work-request-form/work-request-form.component';
import { NewRequestFormComponent } from './new-request-form/new-request-form.component';
import { CalendarCompComponent } from './calendar-comp/calendar-comp.component';
import { RateChartComponent } from './rate-chart/rate-chart.component';
import { WorkRequestDetailComponent } from './work-request-form/work-request-detail/work-request-detail.component';
import { ReportComponent } from './report/report.component';
import { TechInterfaceComponent } from './tech-interface/tech-interface.component';
import { AllUserComponent } from './all-user/all-user.component';
import { AllRequestAddUpdateComponent } from './all-request-add-update/all-request-add-update.component';
import { AllFacilityAddUpdateComponent } from './all-facility-add-update/all-facility-add-update.component';
import { AllCostCenterAddUpdateComponent } from './all-cost-center-add-update/all-cost-center-add-update.component';
import { AllToolsAddUpdateComponent } from './all-tools-add-update/all-tools-add-update.component';
import { StartEndTestDetailComponent } from './tech-interface/start-end-test-detail/start-end-test-detail.component';
import { TaskRequestDetailComponent } from './work-request-form/task-request-detail/task-request-detail.component';
import { CalenderNewComponent } from './calender-new/calender-new.component';
import { CalendarComponent } from './calendar/calendar.component';
import { Calendar } from '@fullcalendar/core/index.js';
import { ReportbackupComponent } from './reportbackup/reportbackup.component';

export const routes: Routes = [
    {
    path: '',
    component: HeaderFoorterComponent,
    children: [
      { path: '', component: HomeComponent}, 
      { path: 'work-request', component: WorkRequestFormComponent }, 
      { path: 'work-request/detail/:work_request_no', component: WorkRequestDetailComponent }, 
      { path: 'task-request/detail/:work_request_no/:task_request_no', component: TaskRequestDetailComponent }, 
      { path: 'create-work-request', component: NewRequestFormComponent }, 
      // { path: 'calendar', component: CalendarCompComponent }, 
      // { path: 'calendar', component: CalenderNewComponent }, 
      { path: 'calendar', component: CalendarComponent }, 
      { path: 'calendar/:wRnumber/:taskNumber', component: CalendarComponent }, 
      { path: 'report', component: ReportComponent }, 
      { path: 'report-new', component: ReportbackupComponent }, 
      { path: 'rate-chart', component: RateChartComponent }, 
      { path: 'tech-interface', component: TechInterfaceComponent }, 
      { path: 'tech-interface/:taskNumber', component: TechInterfaceComponent }, 
      { path: 'tech-interface/test-detail/:task_id', component: StartEndTestDetailComponent }, 
      { path: 'all-user-detail', component: AllUserComponent }, 
      { path: 'all-facility-detail', component: AllFacilityAddUpdateComponent }, 
      { path: 'all-resource-detail', component: AllRequestAddUpdateComponent }, 
      { path: 'all-cost-center-detail', component: AllCostCenterAddUpdateComponent }, 
      { path: 'all-tools-detail', component: AllToolsAddUpdateComponent }, 
      { path: '**', redirectTo: '', pathMatch: 'full' } 
    ]
  },
  { path: '**', redirectTo: '' }
  
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
  })
  export class AppRoutingModule {
    
   }
