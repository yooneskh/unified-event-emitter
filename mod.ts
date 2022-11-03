
// deno-lint-ignore no-explicit-any
export type PatternEventCallback = (event: string, ...args: any[]) => void | Promise<void>;


export class PatternEventEmitter {

  private eventRegistrations: [RegExp, PatternEventCallback, number?][] = [];


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
    this.eventRegistrations.push([
      this.makeRegExpFromEvent(event),
      callback,
    ]);
  }

  public once(event: string, callback: PatternEventCallback) {
    this.eventRegistrations.push([
      this.makeRegExpFromEvent(event),
      callback,
      1,
    ]);
  }

  public times(event: string, count: number, callback: PatternEventCallback) {
    this.eventRegistrations.push([
      this.makeRegExpFromEvent(event),
      callback,
      count,
    ]);
  }

  // deno-lint-ignore no-explicit-any
  public async emit(event: string, ...args: any[]) {
    for (let i = this.eventRegistrations.length - 1; i >= 0; i--) {

      const registration = this.eventRegistrations[i];

      if (!registration[0].test(event)) {
        continue;
      }


      try {
        if (this.sequential) {
          await registration[1](event, ...args);
        }
        else {
          registration[1](event, ...args);
        }
      }
      catch (error) {
        console.error(error);
      }


      if (registration[2] !== undefined) {

        registration[2]--;

        if (!( registration[2] > 0 )) {
          this.eventRegistrations.splice(i, 1);
        }

      }

    }
  }

}
