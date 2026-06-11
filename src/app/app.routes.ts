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
import { authGuard } from './Services/auth/auth.guard';
import { adminGuard } from './Services/auth/auth.guard';
import { technicalGuard } from './Services/auth/auth.guard';
import { LandingHomeComponent } from './landing-home/landing-home.component';
import { ProfilePageComponent } from './profile-page/profile-page.component';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./header-foorter/header-foorter.component').then(
        (m) => m.HeaderFoorterComponent
      ),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./landing-home/landing-home.component').then(
            (m) => m.LandingHomeComponent
          ),
        canActivate: [authGuard],
      },
      {
        path: 'work-request',
        loadComponent: () =>
          import('./work-request-form/work-request-form.component').then(
            (m) => m.WorkRequestFormComponent
          ),
        canActivate: [authGuard],
      },
      {
        path: 'work-request/detail/:work_request_no',
        loadComponent: () =>
          import('./work-request-form/work-request-detail/work-request-detail.component').then(
            (m) => m.WorkRequestDetailComponent
          ),
        canActivate: [authGuard],
      },
      {
        path: 'task-request/detail/:work_request_no/:task_request_no',
        loadComponent: () =>
          import('./work-request-form/task-request-detail/task-request-detail.component').then(
            (m) => m.TaskRequestDetailComponent
          ),
        canActivate: [authGuard],
      },
      {
        path: 'test/:dataCenter/:taskNumber',
        loadComponent: () =>
          import('./work-request-form/task-request-detail/data/data.component').then(
            (m) => m.DataComponent
          ),
        canActivate: [authGuard],
      },
      {
        path: 'create-work-request',
        loadComponent: () =>
          import('./new-request-form/new-request-form.component').then(
            (m) => m.NewRequestFormComponent
          ),
        canActivate: [authGuard],
      },
      {
        path: 'calendar',
        loadComponent: () =>
          import('./calendar/calendar.component').then(
            (m) => m.CalendarComponent
          ),
        canActivate: [authGuard],
      },
      {
        path: 'calendar/:wRnumber/:taskNumber',
        loadComponent: () =>
          import('./calendar/calendar.component').then(
            (m) => m.CalendarComponent
          ),
        canActivate: [authGuard],
      },
      {
        path: 'report',
        loadComponent: () =>
          import('./report/report.component').then((m) => m.ReportComponent),
        canActivate: [authGuard],
      },
      {
        path: 'report-new',
        loadComponent: () =>
          import('./reportbackup/reportbackup.component').then(
            (m) => m.ReportbackupComponent
          ),
        canActivate: [authGuard],
      },
      {
        path: 'tech-interface',
        loadComponent: () =>
          import('./tech-interface/tech-interface.component').then(
            (m) => m.TechInterfaceComponent
          ),
        canActivate: [authGuard, technicalGuard],
      },
      {
        path: 'tech-interface/:taskNumber',
        loadComponent: () =>
          import('./tech-interface/tech-interface.component').then(
            (m) => m.TechInterfaceComponent
          ),
        canActivate: [authGuard, technicalGuard],
      },
      {
        path: 'tech-interface/test-detail/:task_id',
        loadComponent: () =>
          import('./tech-interface/start-end-test-detail/start-end-test-detail.component').then(
            (m) => m.StartEndTestDetailComponent
          ),
        canActivate: [authGuard],
      },
      {
        path: 'all-user-detail',
        loadComponent: () =>
          import('./all-user/all-user.component').then((m) => m.AllUserComponent),
        canActivate: [authGuard, adminGuard],
      },
      {
        path: 'all-user-detail/:user_id',
        loadComponent: () =>
          import('./all-user/all-user.component').then((m) => m.AllUserComponent),
        canActivate: [authGuard, adminGuard],
      },
      {
        path: 'current-user-detail',
        loadComponent: () =>
          import('./profile-page/profile-page.component').then(
            (m) => m.ProfilePageComponent
          ),
        canActivate: [authGuard],
      },
      {
        path: 'rate-chart',
        loadComponent: () =>
          import('./rate-chart/rate-chart.component').then(
            (m) => m.RateChartComponent
          ),
        canActivate: [authGuard, adminGuard],
      },
      {
        path: 'all-facility-detail',
        loadComponent: () =>
          import('./all-facility-add-update/all-facility-add-update.component').then(
            (m) => m.AllFacilityAddUpdateComponent
          ),
        canActivate: [authGuard, adminGuard],
      },
      {
        path: 'all-resource-detail',
        loadComponent: () =>
          import('./all-request-add-update/all-request-add-update.component').then(
            (m) => m.AllRequestAddUpdateComponent
          ),
        canActivate: [authGuard, adminGuard],
      },
      {
        path: 'all-cost-center-detail',
        loadComponent: () =>
          import('./all-cost-center-add-update/all-cost-center-add-update.component').then(
            (m) => m.AllCostCenterAddUpdateComponent
          ),
        canActivate: [authGuard, adminGuard],
      },
      {
        path: 'all-tools-detail',
        loadComponent: () =>
          import('./all-tools-add-update/all-tools-add-update.component').then(
            (m) => m.AllToolsAddUpdateComponent
          ),
        canActivate: [authGuard, adminGuard],
      },
      {
        path: 'help-center',
        loadComponent: () =>
          import('./help-center/help-center.component').then(
            (m) => m.HelpCenterComponent
          ),
        canActivate: [authGuard],
      },

      { path: '**', redirectTo: '', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: '' },
];

// export const routes: Routes = [
//     {
//     path: '',
//     component: HeaderFoorterComponent, canActivate: [authGuard],
//     children: [
//       { path: '', component: LandingHomeComponent,canActivate: [authGuard]}, 
//       // { path: '', component: HomeComponent,canActivate: [authGuard]}, 
//       { path: 'work-request', component: WorkRequestFormComponent,canActivate: [authGuard] }, 
//       { path: 'work-request/detail/:work_request_no', component: WorkRequestDetailComponent,canActivate: [authGuard] }, 
//       { path: 'task-request/detail/:work_request_no/:task_request_no', component: TaskRequestDetailComponent,canActivate: [authGuard] }, 
//       { path: 'create-work-request', component: NewRequestFormComponent,canActivate: [authGuard] },
//       { path: 'calendar', component: CalendarComponent,canActivate: [authGuard] }, 
//       { path: 'calendar/:wRnumber/:taskNumber', component: CalendarComponent,canActivate: [authGuard] }, 
//       { path: 'report', component: ReportComponent,canActivate: [authGuard] }, 
//       { path: 'report-new', component: ReportbackupComponent,canActivate: [authGuard] }, 
//       { path: 'tech-interface', component: TechInterfaceComponent,canActivate: [authGuard,technicalGuard] }, 
//       { path: 'tech-interface/:taskNumber', component: TechInterfaceComponent,canActivate: [authGuard,technicalGuard] }, 
//       { path: 'tech-interface/test-detail/:task_id', component: StartEndTestDetailComponent,canActivate: [authGuard] }, 
//       { path: 'all-user-detail', component: AllUserComponent,canActivate: [authGuard,adminGuard] }, 
//       { path: 'current-user-detail', component: ProfilePageComponent,canActivate: [authGuard] }, 
//       { path: 'rate-chart', component: RateChartComponent,canActivate: [authGuard,adminGuard] }, 
//       { path: 'all-facility-detail', component: AllFacilityAddUpdateComponent,canActivate: [authGuard,adminGuard] }, 
//       { path: 'all-resource-detail', component: AllRequestAddUpdateComponent,canActivate: [authGuard,adminGuard] }, 
//       { path: 'all-cost-center-detail', component: AllCostCenterAddUpdateComponent,canActivate: [authGuard,adminGuard] }, 
//       { path: 'all-tools-detail', component: AllToolsAddUpdateComponent,canActivate: [authGuard,adminGuard] }, 
//       { path: '**', redirectTo: '', pathMatch: 'full' } 
//     ]
//   },
//   { path: '**', redirectTo: '' }
// ];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {

}
