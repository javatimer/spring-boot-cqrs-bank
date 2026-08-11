import { Service } from '@angular/core';
import { Observable } from 'rxjs';
import { AccountUpdateEvent } from '../models/account-update-event';

@Service()
export class AccountEventsService {

    events(): Observable<AccountUpdateEvent> {

        return new Observable(observer => {

            const eventSource = new EventSource('http://localhost:5011/api/v1/events/accounts');

            eventSource.onmessage = event => {
                const data = JSON.parse(event.data) as AccountUpdateEvent;
                observer.next(data);
            };

            eventSource.onerror = err => {
                observer.error(err);
                eventSource.close();
            };

            return () => eventSource.close();
        });
    }
}
