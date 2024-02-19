import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'platform' })
export class LaunchQueue {
  readonly params = new Observable<LaunchParams>((subscriber) => {
    if (window.launchQueue) {
      window.launchQueue.setConsumer(params => {
        subscriber.next(params);
        subscriber.complete();
      });
    } else {
      subscriber.complete();
    }
  });
}
