import { Component, ElementRef, HostListener, NgZone, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { CommonServiceService } from '../Services/common-service.service';
import { Router } from '@angular/router';
import { AllApiServiceService } from '../Services/all-api-service.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-landing-home',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './landing-home.component.html',
  styleUrl: './landing-home.component.scss',
  standalone: true,
})
export class LandingHomeComponent {
  searchWorkTaskReq: string = '';
  isLoading: boolean = false;
  @ViewChild('dropdownContainer') dropdownContainer!: ElementRef;
  @ViewChild('inputField') inputField!: ElementRef;
  @HostListener('document:click', ['$event'])
  handleClickOutside(event: Event): void {
    if (!this.inputField || !this.dropdownContainer) {
      return;
    }

    const clickedInsideInput = this.inputField.nativeElement.contains(event.target);
    const clickedInsideDropdown = this.dropdownContainer.nativeElement.contains(event.target);

    if (!clickedInsideInput && !clickedInsideDropdown) {
      this.workTaskList = [];
      this.showDropdown = true;
    }
  }
  constructor(private titleService: Title,
    private router: Router,
    private ngZone: NgZone,
    private allApiService: AllApiServiceService,
    private commonService: CommonServiceService) {
    this.titleService.setTitle("Home | TestTrack HALLIBURTON");
    this.isLoading = true;
    this.startPolling();
    this.search_workrequest_taskrequest();
  }

  shouldPollData(): boolean {
    return !Object.values(this.searchWorkTaskReq).some(value => value !== '');
  }
  private pollingInterval: ReturnType<typeof setInterval> | null = null;
  startPolling() {
    if (this.shouldPollData()) {
      this.search_workrequest_taskrequest();

      this.ngZone.runOutsideAngular(() => {
        this.pollingInterval = setInterval(() => {
          this.ngZone.run(() => {
            if (this.shouldPollData()) {
              this.search_workrequest_taskrequest();
            } else {
              clearInterval(this.pollingInterval!);
              this.pollingInterval = null;
            }
          });
        }, 5000);
      });
    }
  }

  workTaskList: any;
  results: any
  search_workrequest_taskrequest() {
    this.allApiService.search_workrequest_taskrequest().subscribe({
      next: (res) => {
        this.results = res;
        const workReqArray = this.results[0].map((item: any) => 'WR' + item);
        const taskReqArray = this.results[2].map((item: any) => item);
        this.results = [...workReqArray, ...taskReqArray]
        this.isLoading = false;
      },
      error: (err) => {
        this.commonService.displayWarning('Error fetching search data. Please try again later. 🛠️');
        this.isLoading = false;
      }
    });
  }

  ngOnInit(): void { }

  ngOnDestroy(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  scrollToElement(elementId: string): void {
    if (elementId === '') {
      this.commonService.displayWarning('Work in progress! We are working on this. 🛠️')
      return
    }
    window.scrollTo(0, 0)
    this.router.navigate([elementId]);
    // const element = document.getElementById(elementId);
    // if (element) {
    //   // element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    //   const yOffset = -50;
    //   const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
    //   window.scrollTo({ top: y, behavior: 'smooth' });
    // }
  }

  showDropdown: boolean = false;
  show() {
    this.showDropdown = true;
    this.workTaskList = this.results;
  }

  filteredAutocomplete() {
    if (this.shouldPollData()) {
      this.startPolling();
    } else {
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval!);
        this.pollingInterval = null;
      }
    }
    if (this.searchWorkTaskReq) {
      const matchedData = this.workTaskList.filter((item: any) =>
        item.toLowerCase().includes(this.searchWorkTaskReq.toLowerCase())
      );

      this.workTaskList = matchedData.length > 0 ? matchedData : ['No data with this search']
    } else {
      this.workTaskList = [...this.results];
    }
  }

  navigateToDetail(item: string) {

    if (
      item === 'No data with this search'
    ) {
      this.commonService.displayWarning('No matching work request or task request found. Please try a different search term. 🔍')
      return
    }
    this.searchWorkTaskReq = '';
    this.workTaskList = [];
    this.showDropdown = false;
    if (item.includes('/TK')) {
      item = item.split('-')[0].trim();
      const url = `task-request/detail/${item}`;
      window.open(url, '_blank');
    } else {
      window.open(`work-request/detail/${item}`, '_blank');
    }
  }

  downloadFile() {
    const link = document.createElement('a');
    link.href = 'assets/TestTrack User Manual.pdf';
    link.download = 'TestTrack User Manual.pdf';
    link.click();
    this.commonService.displaySuccess('User Manual download started! 📥')
  }

}
