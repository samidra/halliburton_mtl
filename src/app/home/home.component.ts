import { CommonModule } from '@angular/common';
import { Component, } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { NgxPaginationModule } from 'ngx-pagination';
import { CanvasJSAngularChartsModule } from '@canvasjs/angular-charts';
import { LocalStorageService } from '../Services/local-storage.service';

@Component({
  selector: 'app-home',
  imports: [CommonModule, FormsModule,CanvasJSAngularChartsModule, ReactiveFormsModule, NgxPaginationModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  isLoading: boolean = true;
  new_work_request !: FormGroup;
  resourcesOptions = ['Resource 1', 'Resource 2', 'Resource 3'];
  curren_year: number = new Date().getFullYear()
  dates: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31]
  daysInMonth: number[] = [];
  months: { month: string, days: number[] }[] = [];
  
  ngOnInit(): void {
    const title = "Home | MTL HALLIBURTON";   
    this.titleService.setTitle(title);
    this.new_work_request = this.fb.group({
      resources: [''],
    });

    setTimeout(() => {
    this.isLoading = false;
    },  1000);

  }

  constructor(private fb: FormBuilder,
    private titleService: Title,) {
    this.isLoading = true;
    this.generateDaysForEachMonth();
  }

  page = 1;
  pages = 1;
  itemsPerPage: number = 10;
  
  dummyArray = [
    { work_requestor: 'John Doe', work_request_no: 'work_request_no_options 1', chargeCode: 'Option 1', requestDescription: 'Sample request description 1', comment: 'This is a comment 1', tools: 'Tool 1', resources: 'Resource 1', location: 'Location 1', duration: '2 hours', pslCompany: 'PSL 1', status: 'Active' },
    { work_requestor: 'Jane Smith', work_request_no: 'work_request_no_options 2', chargeCode: 'Option 2', requestDescription: 'Sample request description 2', comment: 'This is a comment 2', tools: 'Tool 2', resources: 'Resource 2', location: 'Location 2', duration: '4 hours', pslCompany: 'PSL 2', status: 'Pending' },
    { work_requestor: 'Alice Johnson', work_request_no: 'work_request_no_options 3', chargeCode: 'Option 3', requestDescription: 'Sample request description 3', comment: 'This is a comment 3', tools: 'Tool 3', resources: 'Resource 3', location: 'Location 3', duration: '1 hour', pslCompany: 'PSL 3', status: 'Group 3' },
    { work_requestor: 'Michael Brown', work_request_no: 'work_request_no_options 4', chargeCode: 'Option 1', requestDescription: 'Sample request description 4', comment: 'This is a comment 4', tools: 'Tool 1', resources: 'Resource 4', location: 'Location 4', duration: '3 hours', pslCompany: 'PSL 1', status: 'Group 2' },
    { work_requestor: 'Emma Davis', work_request_no: 'work_request_no_options 5', chargeCode: 'Option 2', requestDescription: 'Sample request description 5', comment: 'This is a comment 5', tools: 'Tool 2', resources: 'Resource 5', location: 'Location 5', duration: '5 hours', pslCompany: 'PSL 2', status: 'Group 1' },
    { work_requestor: 'Liam Wilson', work_request_no: 'work_request_no_options 6', chargeCode: 'Option 3', requestDescription: 'Sample request description 6', comment: 'This is a comment 6', tools: 'Tool 3', resources: 'Resource 6', location: 'Location 6', duration: '6 hours', pslCompany: 'PSL 3', status: 'Group 3' },
    { work_requestor: 'Olivia Martinez', work_request_no: 'work_request_no_options 7', chargeCode: 'Option 1', requestDescription: 'Sample request description 7', comment: 'This is a comment 7', tools: 'Tool 1', resources: 'Resource 7', location: 'Location 7', duration: '7 hours', pslCompany: 'PSL 1', status: 'Group 2' },
    { work_requestor: 'Sophia Taylor', work_request_no: 'work_request_no_options 8', chargeCode: 'Option 2', requestDescription: 'Sample request description 8', comment: 'This is a comment 8', tools: 'Tool 2', resources: 'Resource 8', location: 'Location 8', duration: '6 hours', pslCompany: 'PSL 2', status: 'Group 1' },
    { work_requestor: 'Mason Anderson', work_request_no: 'work_request_no_options 9', chargeCode: 'Option 3', requestDescription: 'Sample request description 9', comment: 'This is a comment 9', tools: 'Tool 3', resources: 'Resource 9', location: 'Location 9', duration: '8 hours', pslCompany: 'PSL 3', status: 'Group 3' },
    { work_requestor: 'Isabella Thomas', work_request_no: 'work_request_no_options 10', chargeCode: 'Option 1', requestDescription: 'Sample request description 10', comment: 'This is a comment 10', tools: 'Tool 1', resources: 'Resource 10', location: 'Location 10', duration: '9 hours', pslCompany: 'PSL 1', status: 'Group 2' },

    // 10 new entries
    { work_requestor: 'Lucas Harris', work_request_no: 'work_request_no_options 11', chargeCode: 'Option 2', requestDescription: 'Sample request description 11', comment: 'This is a comment 11', tools: 'Tool 1', resources: 'Resource 11', location: 'Location 11', duration: '10 hours', pslCompany: 'PSL 2', status: 'Group 1' },
    { work_requestor: 'Mia Roberts', work_request_no: 'work_request_no_options 12', chargeCode: 'Option 3', requestDescription: 'Sample request description 12', comment: 'This is a comment 12', tools: 'Tool 2', resources: 'Resource 12', location: 'Location 12', duration: '12 hours', pslCompany: 'PSL 3', status: 'Group 2' },
    { work_requestor: 'Ethan Walker', work_request_no: 'work_request_no_options 13', chargeCode: 'Option 1', requestDescription: 'Sample request description 13', comment: 'This is a comment 13', tools: 'Tool 3', resources: 'Resource 13', location: 'Location 13', duration: '3 hours', pslCompany: 'PSL 1', status: 'Group 1' },
    { work_requestor: 'Ava Scott', work_request_no: 'work_request_no_options 14', chargeCode: 'Option 2', requestDescription: 'Sample request description 14', comment: 'This is a comment 14', tools: 'Tool 1', resources: 'Resource 14', location: 'Location 14', duration: '7 hours', pslCompany: 'PSL 2', status: 'Group 3' },
    { work_requestor: 'Jackson Lee', work_request_no: 'work_request_no_options 15', chargeCode: 'Option 3', requestDescription: 'Sample request description 15', comment: 'This is a comment 15', tools: 'Tool 2', resources: 'Resource 15', location: 'Location 15', duration: '5 hours', pslCompany: 'PSL 3', status: 'Group 2' },
    { work_requestor: 'Lily Hall', work_request_no: 'work_request_no_options 16', chargeCode: 'Option 1', requestDescription: 'Sample request description 16', comment: 'This is a comment 16', tools: 'Tool 3', resources: 'Resource 16', location: 'Location 16', duration: '8 hours', pslCompany: 'PSL 1', status: 'Group 1' },
    { work_requestor: 'James Young', work_request_no: 'work_request_no_options 17', chargeCode: 'Option 2', requestDescription: 'Sample request description 17', comment: 'This is a comment 17', tools: 'Tool 1', resources: 'Resource 17', location: 'Location 17', duration: '4 hours', pslCompany: 'PSL 2', status: 'Group 3' },
    { work_requestor: 'Harper King', work_request_no: 'work_request_no_options 18', chargeCode: 'Option 3', requestDescription: 'Sample request description 18', comment: 'This is a comment 18', tools: 'Tool 2', resources: 'Resource 18', location: 'Location 18', duration: '6 hours', pslCompany: 'PSL 3', status: 'Group 1' },
    { work_requestor: 'Benjamin Wright', work_request_no: 'work_request_no_options 19', chargeCode: 'Option 1', requestDescription: 'Sample request description 19', comment: 'This is a comment 19', tools: 'Tool 3', resources: 'Resource 19', location: 'Location 19', duration: '9 hours', pslCompany: 'PSL 1', status: 'Group 2' },
    { work_requestor: 'Charlotte Lopez', work_request_no: 'work_request_no_options 20', chargeCode: 'Option 2', requestDescription: 'Sample request description 20', comment: 'This is a comment 20', tools: 'Tool 1', resources: 'Resource 20', location: 'Location 20', duration: '10 hours', pslCompany: 'PSL 2', status: 'Group 3' }
  ];

  monthly_request = {
	  animationEnabled: true,
	  title: {
		text: "Monthly Test Request Report",
	  },
	  axisX: {
		labelAngle: -90
	  },
	  axisY: {
		title: "Test request/month"
	  },
	  axisY2: {
		title: "Test request/day"
	  },
	  toolTip: {
		shared: true
	  },
	  legend:{
		cursor:"pointer",
		itemclick: function(e: any){
		  if (typeof(e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
			e.dataSeries.visible = false;
		  }
		  else {
			e.dataSeries.visible = true;
		  }
		  e.chart.render();
		}
	  },
	  data: [{
	    type: "column",	
	    name: "Total Test Request ",
	    legendText: "Total Test Request",
	    showInLegend: true,
	    dataPoints:[
	  	  {label: "January", y: 262,},
	  	  {label: "February", y: 211},
	  	  {label: "March", y: 175},
	  	  {label: "April", y: 137},
	  	  {label: "May", y: 115},
	  	  {label: "June", y: 104},
	  	  {label: "July", y: 978},
	  	  {label: "August", y: 60},
	  	  {label: "September", y: 233},
	  	  {label: "October", y: 204},
	  	  {label: "November", y: 204},
	  	  {label: "December", y: 204}
	  ]
	  }, {
	    type: "column",	
	    name: "Total Test Request Completed",
	    legendText: "Total Test Request Completed",
	    axisYType: "secondary",
	    showInLegend: true,
	    dataPoints:[
	  	  {label: "January", y: 115},
	  	  {label: "February", y: 25},
	  	  {label: "March", y: 36},
	  	  {label: "April", y: 42},
	  	  {label: "May", y: 26},
	  	  {label: "June", y: 27},
	  	  {label: "July", y: 31},
	  	  {label: "August", y: 123},
	  	  {label: "September", y: 103},
	  	  {label: "October", y: 43},
	  	  {label: "November", y: 43},
	  	  {label: "December", y: 43}
	  ]
    }]
  }	
  
  chartOptions = {
    animationEnabled: true,
    title:{
      text: "",
      fontFamily: "Trebuchet MS, Helvetica, sans-serif"
    },
    axisY:{
      title: "Response values",
      includeZero: true,
      interval: 100
    },
    toolTip: {
      shared: true
    },
    data: [{
      type: "bar",
      name: "Approved",
      toolTipContent: "{label} {name}: {y}",
      dataPoints: [
        { y: 18, label: "Total Users" },
        { y: 28, label: "Total Cost Center" },
        { y: 80, label: "Total PSL" },
        { y: 218, label: "Total Resource" },
        { y: 38, label: "Total Facility" },
        { y: 74, label: "Total Tools" },
        { y: 94, label: "Total Charge Code" },
      ]
    }, 
    {
      type: "error",
      name: "Pending",
      toolTipContent: "{name}: {y}",
      dataPoints: [
        { y: 8, label: "Total Users" },
        { y: 18, label: "Total Cost Center" },
        { y: 30, label: "Total PSL" },
        { y: 18, label: "Total Resource" },
        { y: 58, label: "Total Facility" },
        { y: 24, label: "Total Tools" },
        { y: 14, label: "Total Charge Code" },
      ]
    }]
  }

  work_request_chart = {
	  animationEnabled: true,
	  // title:{
		// text: "Work Request Details"
	  // },
	  data: [{
		type: "doughnut",
		yValueFormatString: "#,###.##",
		indexLabel: "{name}",
    indexLabelFontSize: 13,
    indexLabelFontColor: "black",
    indexLabelBackgroundColor: "#e3e3e3",
    innerRadius: "90%", 
    radius: "90%",
		dataPoints: [
      { y: 38, name: "All Request", color: "#6495ed",showInLegend: true },
      { y: 20, name: "Request: Pending", color: "#ffcc00",showInLegend: true },
      { y: 20, name: "Request: Scheduled Test", color: "#00ffff",showInLegend: true },
      { y: 20, name: "Request: Unscheduled Test", color: "#ff9900",showInLegend: true},
      { y: 20, name: "Request: Approved", color: "#00b33c",showInLegend: true },
      { y: 20, name: "Request: Not Approved", color: "#b30000",showInLegend: true }
		]
	  }]
	}

  test_chart = {
	  animationEnabled: true,
    
	  // title:{
		// text: "Work Request Details"
	  // },
	  data: [{
		type: "doughnut",
		yValueFormatString: "#,###.##",
		indexLabel: "{name}",
    indexLabelFontSize: 13,
    indexLabelFontColor: "black",
    indexLabelBackgroundColor: "#e3e3e3",
    innerRadius: "90%", 
    radius: "90%",

		dataPoints: [
		  { y: 28, name: "All Test Generated",color: "#6495ed",showInLegend: true },
		  { y: 10, name:  "Test: On Going", color: "#1aff1a",showInLegend: true},
		  { y: 20, name:  "Test: Paused",color: "#ff9900",showInLegend: true },
		  { y: 20, name:  "Test: Completed",showInLegend: true }
		]
	  }]
	}

  view_all_detail(test_id: any) {
    window.open(`tech-interface/test-detail/${test_id}`, '_blank')
  }

   view_work_request_detail(work_request_no: any) {
    window.open(`work-request/detail/${work_request_no}`, '_blank')
  }

  scrollToElement(elementId: string): void {
    const element = document.getElementById(elementId);
    if (element) {
      // element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const yOffset = -50; 
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }

  generateDaysForEachMonth(): void {
    const currentYear = new Date().getFullYear();
    const monthsNames = [
      'January', 'February', 'March', 'April', 'May', 'June', 'July',
      'August', 'September', 'October', 'November', 'December'
    ];

    monthsNames.forEach((month, index) => {
      const daysInMonth = this.getDaysInMonth(currentYear, index);
      const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
      this.months.push({ month, days: daysArray });
    });
  }

  getDaysInMonth(year: number, monthIndex: number): number {
    const lastDayOfMonth = new Date(year, monthIndex + 1, 0);
    return lastDayOfMonth.getDate();
  }

}

  