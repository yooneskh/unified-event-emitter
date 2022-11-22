
// deno-lint-ignore no-explicit-any
export type PatternEventCallback = (event: string, ...args: any[]) => void | Promise<void>;

interface IEventRegistration {
  event: string;
  regex: RegExp;
  callback: PatternEventCallback;
  count?: number;
}


export class PatternEventEmitter {

  private eventRegistrations: IEventRegistration[] = [];


  constructor(private sequential = false) {

  }


  private makeRegExpFromEvent(event: string): RegExp {

    const pattern = (event
      .split('.')
      .map(part => part.replaceAll('*', '.*'))
      .join('\\.')
    );

    return new RegExp(`^${pattern}$`);

  }


  public on(event: string, callback: PatternEventCallback) {
    this.eventRegistrations.push({
      event,
      regex: this.makeRegExpFromEvent(event),
      callback,
    });
  }

  public once(event: string, callback: PatternEventCallback) {
    this.eventRegistrations.push({
      event,
      regex: this.makeRegExpFromEvent(event),
      callback,
      count: 1,
    });
  }

  public times(event: string, count: number, callback: PatternEventCallback) {
    this.eventRegistrations.push({
      event,
      regex: this.makeRegExpFromEvent(event),
      callback,
      count,
    });
  }

  public clearEvent(event: string) {
    this.eventRegistrations = this.eventRegistrations.filter(it => !it.regex.test(event));
  }

  public clearCallback(callback: PatternEventCallback) {
    this.eventRegistrations.splice(
      this.eventRegistrations.findIndex(it => it.callback === callback),
      1,
    );
  }

  // deno-lint-ignore no-explicit-any
  public async emit(event: string, ...args: any[]) {
    for (const registration of [...this.eventRegistrations]) {

      if (!registration.regex.test(event)) {
        continue;
      }


      try {
        if (this.sequential) {
          await registration.callback(event, ...args);
        }
        else {
          registration.callback(event, ...args);
        }
      }
      catch (error) {
        console.error(error);
      }


      if (registration.count !== undefined) {

        registration.count--;

        if (!( registration.count > 0 )) {
          this.eventRegistrations.splice(
            this.eventRegistrations.indexOf(registration),
            1
          );
        }

      }

    }
  }

}
