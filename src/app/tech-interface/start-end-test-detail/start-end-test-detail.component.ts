import { Component, Inject, NgZone } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule, DatePipe } from '@angular/common';
import { CommonServiceService } from '../../Services/common-service.service';
import { OnDestroy, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-start-end-test-detail',
  imports: [CommonModule, FormsModule],
  templateUrl: './start-end-test-detail.component.html',
  styleUrl: './start-end-test-detail.component.scss'
})
export class StartEndTestDetailComponent implements OnInit, OnDestroy {

  startTime: number = new Date('2025-09-15T10:00:00').getTime();
  startTimeshow: string = new Date('2025-09-15T10:00:00').toISOString().slice(0, 16);
  endTime: number = new Date('2025-09-30T14:30:00').getTime();
  endTimeshow: string = new Date('2025-09-30T14:30:00').toISOString().slice(0, 16);
  remainingTime: string = '00:00:00:00';
  testTimeTillNow: string = '00:00:00:00';
  private intervalId: any;
  constructor(
    private titleService: Title,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private ngZone: NgZone) {

  }

  test_id: any
  ngOnInit(): void {

    this.titleService.setTitle(`Test ID ${this.test_id}: | Detail | MTL HALLIBURTON`);
    this.route.paramMap.subscribe((params) => {
      this.test_id = params.get('test_id')
    })

    console.log('Timer started');
    this.startTimer()
  }

  ngOnDestroy(): void {
    clearInterval(this.intervalId);
  }

  private startTimer(): void {

    const now = Date.now();
    if (now < this.startTime) {
      this.remainingTime = 'Timer not started yet';
      return;
    }
    if (now >= this.endTime) {
      this.remainingTime = '00:00:00:00';
      console.log('End time reached. Timer stopped.');
      return;
    }

    this.testRemainingTime();
    this.testDurationTillNow();

    this.ngZone.runOutsideAngular(() => {
      this.intervalId = setInterval(() => {
        this.ngZone.run(() => {
          this.testRemainingTime();
          this.testDurationTillNow();
        });
      }, 1000);
    });
  }

  is_test_pause: boolean = false
  is_test_end: boolean = false
  pause_timer(request: any) {
    const dialogRef = this.dialog.open(pause_test, {

      data: { request },
      width: '300px',
      panelClass: 'full-width-dialog'
    })

    dialogRef.afterClosed().subscribe(result => {

      if (result === 'confirm pause') {
        clearInterval(this.intervalId);
        this.is_test_pause = true
      } else if (result === 'confirm restart') {
        this.is_test_pause = false
        this.startTimer()
      } else if (result === 'confirm end') {
        this.is_test_end = true
        clearInterval(this.intervalId);
      } else if (result === 'confirm force restart') {
        this.is_test_end = false
        this.startTimer()
      }
    })
  }

  private testRemainingTime(): void {
    const now = Date.now();
    const remaining = this.endTime - now;

    if (remaining <= 0) {
      this.remainingTime = '00:00:00:00';
      return;
    }

    const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

    this.remainingTime = `${this.padZero(days)} Days : ${this.padZero(hours)} Hours : ${this.padZero(minutes)} Minutes : ${this.padZero(seconds)} Seconds`;
  }

  testDurationTillNow() {

    const now = Date.now();
    const remaining = now - this.startTime;

    if (remaining <= 0) {
      this.remainingTime = '00:00:00:00';
      return;
    }

    const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

    this.testTimeTillNow = `${this.padZero(days)} Days : ${this.padZero(hours)} Hours : ${this.padZero(minutes)} Minutes : ${this.padZero(seconds)} Seconds`;

  }

  private padZero(num: number): string {
    return num < 10 ? `0${num}` : `${num}`;
  }

}


@Component({
  selector: 'pause_test',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="container-fluid common_dialog_confirm">
      <div class="row">
        <div class="col-12">
          <h2 *ngIf="request === 'pause'">Confirm, if you want to Pause this test ?</h2>
          <h2 *ngIf="request === 'restart'">Confirm, if you want to Restart this test ?</h2>
          <h2 *ngIf="request === 'end'">Confirm, if you want to End this test ?</h2>
          <h2 *ngIf="request === 'force restart'">Confirm, if you want to Force Restart this test ?</h2>
          <div class="btn_div">
          <button class="mx-3"  *ngIf="!Is_spinner" (click)="update()">Confirm</button>
          <button class="button_spinner_small"  *ngIf="Is_spinner">
                  <div class="spinner"></div>
          </button>
          <button (click)="close()">Cancel</button>
          </div>
        </div>
      </div>
    </div>
    `,
  styleUrl: './start-end-test-detail.component.scss'
})

export class pause_test {

  request: any
  constructor(public dialogRef: MatDialogRef<pause_test>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private common_service: CommonServiceService) {
    this.request = data.request
  }

  close() {
    this.dialogRef.close()
  }

  Is_spinner: Boolean = false
  update(): void {
    this.Is_spinner = true
    this.Is_spinner = false
    this.common_service.displaySuccess('The test has been paused successfully.')
    if (this.request === 'pause') {
      this.dialogRef.close('confirm pause');
    } else if (this.request === 'restart') {
      this.dialogRef.close('confirm restart');
    } else if (this.request === 'end') {
      this.dialogRef.close('confirm end');
    } else if (this.request === 'force restart') {
      this.dialogRef.close('confirm force restart');
    }
    // const body = {
    //     "ProcessCategory": this.process_category,
    // }

    // this.apiservice.update_process_category(body, this.formType, this.srNO).subscribe((res) => {
    //     console.log(res)
    //     this.Is_spinner = false
    //     this.common_service.displaySuccess('Process Category updated successfully.')
    //     this.close()
    // }, err => {
    //     console.log("ERROR :", err.message);
    //     this.Is_spinner = false
    // })
  }

}
