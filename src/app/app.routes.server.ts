import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: '',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'work-request',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'work-request/detail/:work_request_no',
    renderMode: RenderMode.Server,
  },
  {
    path: 'task-request/detail/:work_request_no/:task_request_no',
    renderMode: RenderMode.Server,
  },
  {
    path: 'create-work-request',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'calendar',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'calendar/:wRnumber/:taskNumber',
    renderMode: RenderMode.Server,
  },
  {
    path: 'report',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'rate-chart',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'tech-interface',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'tech-interface/:taskNumber',
    renderMode: RenderMode.Server,
  },
  {
    path: 'tech-interface/test-detail/:task_id',
    renderMode: RenderMode.Server,
  },
  {
    path: 'all-user-detail',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'all-facility-detail',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'all-resource-detail',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'all-cost-center-detail',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'all-tools-detail',
    renderMode: RenderMode.Prerender,
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
