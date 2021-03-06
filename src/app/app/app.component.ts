import {Component, OnInit} from '@angular/core';
import {
  CovidDataAll,
  CovidDataSaxony,
  CovidGermanySevenDays,
  CovidSaxonySevenDays,
  LeipzigHistory,
  LeipzigIncidenceHistory
} from './interfaces';
import {ApiService} from '../services/api.service';
import {combineLatest} from 'rxjs';
import {SwUpdate} from '@angular/service-worker';
import {DatePipe} from '@angular/common';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [DatePipe]
})
export class AppComponent implements OnInit {
  covidData: CovidDataAll | undefined;
  covidDataSaxony: CovidDataSaxony | undefined;
  covidSevenDaysDataSaxony: CovidSaxonySevenDays | undefined;
  covidSevenDaysDataGermany: CovidGermanySevenDays | undefined;
  frozenIncidencesForLeipzig: LeipzigIncidenceHistory[] | undefined;
  leipzigData: number[] = [];
  leipzigDataDays: string[] = [];
  mapImage: any;
  stateMapImage: any;
  data: any;
  chartOptions: any;

  get message(): string { return `The light is on`; }

  constructor(private api: ApiService, private swUpdate: SwUpdate, private datePipe: DatePipe) {
  }

  ngOnInit(): void {
    if (this.swUpdate.isEnabled) {
      this.swUpdate.available.subscribe(() => {
        if (confirm('Neue Version verfügbar. Laden?')) {
          window.location.reload();
        }
      });
    }
    combineLatest(
      this.api.getDataForAllFederalStates(),
      this.api.getDataForSaxony(),
      this.api.getSevenDaysDataForGermany(),
      this.api.getSevenDaysDataForSaxony(),
      this.api.getDistrictsMap(),
      this.api.getStatesMap(),
      this.api.getCaseDataFor14DaysLeipzig(),
      this.api.getFrozenIncidencesForLeipzig(),
        // @ts-ignore
      ).subscribe(([federalStatesData,
                         saxonyData,
                         sevenDaysGermany,
                         sevenDaysSaxony,
                         districtsMap, statesMap,
                         leipzigData,
                         leipzigIncidences]
    ) => {
      this.covidData = federalStatesData;
      this.covidDataSaxony = saxonyData;
      this.covidSevenDaysDataGermany = sevenDaysGermany;
      this.covidSevenDaysDataSaxony = sevenDaysSaxony;
      const leipzigIncidenceHistory = Object.values(leipzigIncidences.data).map(val => val) as any;
      this.frozenIncidencesForLeipzig = leipzigIncidenceHistory[0].history;
      this.createImageFromBlob(districtsMap, true);
      this.createImageFromBlob(statesMap, false);
      this.createCharts(leipzigData);
    });
  }

  // tslint:disable-next-line:typedef
  createImageFromBlob(image: Blob, district: boolean) {
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      district ? this.mapImage = reader.result : this.stateMapImage = reader.result;
    }, false);

    if (image) {
      reader.readAsDataURL(image);
    }
  }

  private createCharts(leipzigData: any): void {
    const city = Object.values(leipzigData.data).map(val => val) as any;
    city[0].history.forEach((entry: LeipzigHistory) => {
      this.leipzigData.push(entry.cases);
      this.leipzigDataDays.push(this.datePipe.transform(entry.date) as string);
    });
    this.data = {
      labels: this.leipzigDataDays,
      datasets: [{
        label: '',
        type: 'line',
        borderColor: 'rgba(229, 134, 134, 0.7)',
        borderWidth: 2,
        fill: false,
        data: this.leipzigData
      }, {
        type: 'bar',
        label: '',
        backgroundColor: '#b9adad66',
        data: this.leipzigData
        ,
        borderColor: 'white',
        borderWidth: 2
      }]
    };
    this.chartOptions = {
      plugins: {
        legend: {
          display: false,
        }
      },
      scales: {
        x: {
          ticks: {
            color: '#495057'
          },
          grid: {
            color: '#ebedef'
          }
        },
        y: {
          ticks: {
            color: '#495057'
          },
          grid: {
            color: '#ebedef'
          }
        }
      }
    };
  }


  getLatestDate(date: Date, germany: boolean): any {
    const latestDate = new Date(date);
    latestDate.setDate(latestDate.getDate() - 7);
    if (germany) {
      return this.covidSevenDaysDataGermany?.data.find(data =>
        new Date(data.date).toLocaleDateString() === latestDate.toLocaleDateString());
    } else {
      return this.covidSevenDaysDataSaxony?.data.SN.history.find(data =>
        new Date(data.date).toLocaleDateString() === latestDate.toLocaleDateString());
    }
  }

  testMethod(): string {
    return 'yay';
  }

  testMethod2(no: number, n2: number, test: boolean): any {
    const data = [{one: 1, two: 4}, {one: 2, two: 4}];
    if (test) {
      return data.find(nr => nr.one === no);
    }
    return 'empty';
  }
}
