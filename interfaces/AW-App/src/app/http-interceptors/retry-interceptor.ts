import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { retryWhen, concatMap, delay, timeout } from 'rxjs/operators';

import { TranslateService } from '@ngx-translate/core';

@Injectable()
export class RetryInterceptor implements HttpInterceptor {
  private retryTimeOut = 2000;
  private offlineTimeout = 3000;
  private retryConfirmLabel: string;

  constructor(
    private translate: TranslateService,
  ) { }

  private canRetry(status: number) {
    return (status === 0);
  }

  private loadConfirmLabel() {
    if (!this.retryConfirmLabel) {
      this.retryConfirmLabel = this.translate.instant('connection.error-retry');
    }
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const res = ['/sovrin/credential/get-answers', '/sovrin/create-connection/qr-find-did'];
    // Exclude interceptor for get prefilled answer requests
    for (const re of res) {
      if (request.url.search(re) !== -1) {
        console.log('Exception retry-interceptor');
        return next.handle(request).pipe((timeout(this.offlineTimeout)));
      }
    }


    return next.handle(request)
      .pipe(
        retryWhen(errors => {
          return errors.pipe(
            concatMap((error) => {
              if (this.canRetry(error.status)) {
                this.loadConfirmLabel();

                const attemptRetry = window.confirm(this.retryConfirmLabel);

                if (attemptRetry) {
                  return of(error.status);
                }
              }

              return throwError(error);
            }),
            delay(this.retryTimeOut),
          );
        }),
      );
  }
}
