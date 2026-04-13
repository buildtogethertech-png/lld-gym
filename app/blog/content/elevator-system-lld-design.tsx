export default function Content() {
  return (
    <>
      <p>The Elevator System is one of the most challenging LLD problems because it requires modeling a real-time control system with multiple concurrent actors. It tests your understanding of the State pattern, scheduling algorithms, and clean separation of concerns. Let's break it down completely.</p>

      <h2>Core Requirements</h2>
      <ul>
        <li>Multiple elevators serving a building with multiple floors</li>
        <li>External requests: Up/Down buttons on each floor</li>
        <li>Internal requests: Floor buttons inside the elevator</li>
        <li>Assign the optimal elevator to each request</li>
        <li>Elevator states: Moving Up, Moving Down, Idle</li>
        <li>Door logic: open/close with 5-second safety timeout</li>
        <li>Emergency stop halts all elevators</li>
      </ul>

      <h2>Core Entities</h2>
      <ul>
        <li><strong>Building</strong> — has floors and an ElevatorController</li>
        <li><strong>Floor</strong> — has Up and Down request buttons</li>
        <li><strong>Elevator</strong> — has a state, current floor, and destination queue</li>
        <li><strong>ElevatorController</strong> — receives requests, assigns elevators</li>
        <li><strong>Request</strong> — either an external (floor button) or internal (panel) request</li>
        <li><strong>Door</strong> — manages open/close with timeout</li>
      </ul>

      <h2>Elevator State Machine</h2>
      <pre>{`enum ElevatorState { IDLE, MOVING_UP, MOVING_DOWN, DOORS_OPEN }

class Elevator {
  currentFloor: number;
  state: ElevatorState;
  destinationQueue: number[];  // sorted floors to visit

  addDestination(floor: number): void {
    if (!this.destinationQueue.includes(floor)) {
      this.destinationQueue.push(floor);
      this.sortQueue(); // SCAN algorithm
    }
  }

  move(): void {
    if (this.destinationQueue.length === 0) {
      this.state = ElevatorState.IDLE; return;
    }
    const next = this.destinationQueue[0];
    if (next > this.currentFloor) this.state = ElevatorState.MOVING_UP;
    if (next < this.currentFloor) this.state = ElevatorState.MOVING_DOWN;
    this.currentFloor = next;
    this.destinationQueue.shift();
    this.openDoors();
  }
}`}</pre>

      <h2>Elevator Assignment Strategy</h2>
      <p>The assignment algorithm is a great place to use the Strategy pattern:</p>
      <pre>{`interface ElevatorSelectionStrategy {
  select(request: Request, elevators: Elevator[]): Elevator;
}

class NearestElevatorStrategy implements ElevatorSelectionStrategy {
  select(request: Request, elevators: Elevator[]): Elevator {
    return elevators
      .filter(e => e.state !== ElevatorState.DOORS_OPEN)
      .sort((a, b) =>
        Math.abs(a.currentFloor - request.floor) -
        Math.abs(b.currentFloor - request.floor)
      )[0];
  }
}

class SCANStrategy implements ElevatorSelectionStrategy {
  // Assigns elevator already moving in the same direction, if between current and destination
  select(request: Request, elevators: Elevator[]): Elevator { ... }
}`}</pre>

      <h2>Command Pattern for Requests</h2>
      <pre>{`interface ElevatorCommand { execute(elevator: Elevator): void; }

class GoToFloorCommand implements ElevatorCommand {
  constructor(private floor: number) {}
  execute(elevator: Elevator) { elevator.addDestination(this.floor); }
}

class EmergencyStopCommand implements ElevatorCommand {
  execute(elevator: Elevator) { elevator.emergencyStop(); }
}`}</pre>

      <h2>Common Mistakes</h2>
      <ul>
        <li>Not using a destination queue — elevators need to serve multiple floors in one trip</li>
        <li>Ignoring direction when assigning — an elevator moving up past floor 3 shouldn't be assigned a downward request from floor 2</li>
        <li>Forgetting door timeout — doors must auto-close, this is a State transition</li>
      </ul>
    </>
  );
}
