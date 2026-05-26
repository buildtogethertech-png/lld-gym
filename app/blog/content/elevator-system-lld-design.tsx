export default function Content() {
  return (
    <>
      <p>
        The Elevator System is an advanced Low Level Design problem that combines the State pattern, an
        optimal assignment algorithm, and the SCAN (elevator) scheduling algorithm. It is asked at companies
        like Google, Microsoft, and Atlassian to test your ability to model complex stateful systems with
        multiple concurrent actors. This guide covers the complete Elevator LLD with Java code, class diagram,
        and interview FAQ.
      </p>

      <h2>Why Interviewers Ask Elevator System LLD</h2>
      <p>
        The elevator problem is a State pattern showcase with a real scheduling challenge. Interviewers want
        to see:
      </p>
      <ul>
        <li>Can you model elevator states (IDLE, MOVING_UP, MOVING_DOWN, STOPPED) with the State pattern?</li>
        <li>Can you implement the SCAN algorithm — service all requests in one direction before reversing?</li>
        <li>Do you solve the assignment problem — pick the best elevator for an incoming request?</li>
        <li>Can you handle multiple elevators and multiple floors concurrently?</li>
        <li>Do you separate ElevatorController from Elevator itself (SRP)?</li>
      </ul>

      <h2>Functional Requirements</h2>
      <ul>
        <li>A building has N floors and M elevators</li>
        <li>External request: user presses UP or DOWN button on a floor</li>
        <li>Internal request: user inside elevator presses a floor button</li>
        <li>Controller assigns the best elevator to each external request</li>
        <li>Each elevator services requests using the SCAN algorithm (one direction at a time)</li>
        <li>Display current floor and direction for each elevator</li>
        <li>Handle door open/close between floor arrivals</li>
      </ul>

      <h2>Non-Functional Requirements</h2>
      <ul>
        <li>Assignment algorithm must minimize average wait time</li>
        <li>Elevator state transitions must be thread-safe (multiple requests arrive concurrently)</li>
        <li>Adding a new scheduling algorithm must not change Elevator class (OCP)</li>
      </ul>

      <h2>Core Entities — Elevator System LLD Class Design</h2>
      <ul>
        <li><strong>Building</strong> — total floors, list of elevators, ElevatorController</li>
        <li><strong>Elevator</strong> — id, currentFloor, direction, state, list of pending floors</li>
        <li><strong>ElevatorState</strong> — interface; IdleState, MovingUpState, MovingDownState, StoppedState</li>
        <li><strong>ElevatorController</strong> — receives external requests, assigns elevator</li>
        <li><strong>ExternalRequest</strong> — floor, direction (UP/DOWN)</li>
        <li><strong>InternalRequest</strong> — targetFloor</li>
        <li><strong>AssignmentStrategy</strong> — interface; NearestElevatorStrategy implements it</li>
        <li><strong>Door</strong> — open/close/isOpen state for each elevator</li>
      </ul>

      <h2>Text-Based Class Diagram</h2>
      <pre>{`Building
+-- floors: int
+-- elevators: List<Elevator>
+-- controller: ElevatorController

ElevatorController
+-- strategy: AssignmentStrategy
+-- handleExternalRequest(floor, direction): void

AssignmentStrategy (interface)
+-- assign(request, elevators): Elevator

NearestElevatorStrategy implements AssignmentStrategy

Elevator
+-- id: int
+-- currentFloor: int
+-- direction: Direction (UP/DOWN/NONE)
+-- state: ElevatorState
+-- pendingFloors: TreeSet<Integer>
+-- addRequest(floor): void
+-- step(): void  // move one floor, open door if target

ElevatorState (interface)
+-- handleRequest(elevator, floor): void
+-- move(elevator): void

IdleState       implements ElevatorState
MovingUpState   implements ElevatorState
MovingDownState implements ElevatorState
StoppedState    implements ElevatorState

Door
+-- isOpen: boolean
+-- open() / close()`}</pre>

      <h2>State Pattern — Elevator States in Java</h2>
      <pre>{`public interface ElevatorState {
    void handleRequest(Elevator elevator, int targetFloor);
    void move(Elevator elevator);
}

public class IdleState implements ElevatorState {
    @Override
    public void handleRequest(Elevator elevator, int targetFloor) {
        elevator.getPendingFloors().add(targetFloor);
        if (targetFloor > elevator.getCurrentFloor()) {
            elevator.setDirection(Direction.UP);
            elevator.setState(new MovingUpState());
        } else if (targetFloor < elevator.getCurrentFloor()) {
            elevator.setDirection(Direction.DOWN);
            elevator.setState(new MovingDownState());
        } else {
            elevator.openDoor(); // already at target floor
        }
    }

    @Override
    public void move(Elevator elevator) {
        // Nothing to do when idle
    }
}

public class MovingUpState implements ElevatorState {
    @Override
    public void handleRequest(Elevator elevator, int targetFloor) {
        elevator.getPendingFloors().add(targetFloor);
        // SCAN: requests below current floor while going up are handled on the way down
    }

    @Override
    public void move(Elevator elevator) {
        int next = elevator.getCurrentFloor() + 1;
        elevator.setCurrentFloor(next);
        System.out.println("Elevator " + elevator.getId() + " at floor " + next + " going UP");

        if (elevator.getPendingFloors().contains(next)) {
            elevator.getPendingFloors().remove(next);
            elevator.setState(new StoppedState());
            elevator.openDoor();
        }

        // If no more floors above, reverse direction
        if (elevator.getPendingFloors().isEmpty() ||
            elevator.getPendingFloors().last() <= next) {
            if (elevator.getPendingFloors().isEmpty()) {
                elevator.setState(new IdleState());
                elevator.setDirection(Direction.NONE);
            } else {
                elevator.setState(new MovingDownState());
                elevator.setDirection(Direction.DOWN);
            }
        }
    }
}

public class MovingDownState implements ElevatorState {
    @Override
    public void handleRequest(Elevator elevator, int targetFloor) {
        elevator.getPendingFloors().add(targetFloor);
    }

    @Override
    public void move(Elevator elevator) {
        int next = elevator.getCurrentFloor() - 1;
        elevator.setCurrentFloor(next);

        if (elevator.getPendingFloors().contains(next)) {
            elevator.getPendingFloors().remove(next);
            elevator.setState(new StoppedState());
            elevator.openDoor();
        }

        if (elevator.getPendingFloors().isEmpty() ||
            elevator.getPendingFloors().first() >= next) {
            if (elevator.getPendingFloors().isEmpty()) {
                elevator.setState(new IdleState());
                elevator.setDirection(Direction.NONE);
            } else {
                elevator.setState(new MovingUpState());
                elevator.setDirection(Direction.UP);
            }
        }
    }
}`}</pre>

      <h2>Elevator Assignment — Nearest Elevator Strategy</h2>
      <pre>{`public interface AssignmentStrategy {
    Elevator assign(ExternalRequest request, List<Elevator> elevators);
}

public class NearestElevatorStrategy implements AssignmentStrategy {
    @Override
    public Elevator assign(ExternalRequest request, List<Elevator> elevators) {
        Elevator best = null;
        int minCost = Integer.MAX_VALUE;

        for (Elevator e : elevators) {
            int cost = computeCost(e, request);
            if (cost < minCost) {
                minCost = cost;
                best = e;
            }
        }
        return best;
    }

    private int computeCost(Elevator e, ExternalRequest req) {
        int distance = Math.abs(e.getCurrentFloor() - req.getFloor());

        // Elevator going in the same direction toward the request: low cost
        if (e.getDirection() == Direction.NONE) return distance;
        if (e.getDirection() == Direction.UP && req.getFloor() >= e.getCurrentFloor()) return distance;
        if (e.getDirection() == Direction.DOWN && req.getFloor() <= e.getCurrentFloor()) return distance;

        // Elevator moving away: it must finish current run before it can serve this request
        return distance + 2 * e.getPendingFloors().size();
    }
}`}</pre>

      <h2>Key Design Decisions</h2>
      <ul>
        <li>
          <strong>TreeSet for pending floors:</strong> TreeSet keeps floors sorted and supports first()/last()
          for O(log n) min/max queries. The SCAN algorithm needs to know the highest floor still pending
          (while going up) and the lowest (while going down).
        </li>
        <li>
          <strong>State pattern instead of switch:</strong> Each elevator state encapsulates its own movement
          and request-handling logic. Adding a new state (e.g., MAINTENANCE) is a new class, not a new
          case in a switch statement.
        </li>
        <li>
          <strong>Per-elevator thread vs event loop:</strong> Each elevator can run a step() method on a
          fixed schedule (e.g., every 2 seconds simulating floor travel time). A ScheduledExecutorService
          with one task per elevator is thread-safe if step() is synchronized on the elevator.
        </li>
        <li>
          <strong>AssignmentStrategy decoupled from Controller:</strong> The controller delegates assignment
          entirely to the strategy. Swapping to a load-balanced or predictive strategy requires no changes
          to ElevatorController.
        </li>
      </ul>

      <h2>Common Follow-Up Questions</h2>
      <ul>
        <li>
          <strong>"What is the SCAN algorithm for elevators?"</strong> — The elevator moves in one direction,
          servicing all floors in that direction, then reverses. Like a disk scheduler, this prevents
          starvation compared to always going to the nearest floor (which can keep an elevator oscillating
          in the middle of the building).
        </li>
        <li>
          <strong>"How do you handle maintenance or out-of-service elevators?"</strong> — Add a MAINTENANCE
          state. The assignment strategy filters out elevators not in IDLE, MOVING_UP, or MOVING_DOWN states.
          The state machine prevents new requests from being added.
        </li>
        <li>
          <strong>"How do you simulate real door open/close timing?"</strong> — Door gets an open() method
          that schedules a delayed close() via ScheduledExecutorService. The elevator does not accept new
          move() calls while the door is open (StoppedState handles this).
        </li>
      </ul>

      <h2>FAQ — Elevator System Low Level Design</h2>

      <h3>What design patterns are used in Elevator System LLD?</h3>
      <p>
        The primary patterns are <strong>State</strong> (IdleState, MovingUpState, MovingDownState,
        StoppedState), <strong>Strategy</strong> (NearestElevatorStrategy for assignment), and
        <strong>Observer</strong> (optionally, elevators notify a display board of floor changes).
      </p>

      <h3>What is the SCAN algorithm in elevator design?</h3>
      <p>
        SCAN services all floors in the current direction before reversing. If going up, the elevator
        stops at every pending floor above it, then reverses and services all pending floors on the way
        down. This is fairer than SSTF (shortest seek time first), which can starve high floors when the
        elevator is busy near the bottom.
      </p>

      <h3>How do you assign the best elevator to a request?</h3>
      <p>
        Compute a cost for each elevator: distance to the request floor, adjusted for direction. An
        elevator already moving toward the request costs just the distance. An elevator moving away costs
        distance plus a penalty proportional to its remaining workload. Pick the lowest-cost elevator.
      </p>

      <h3>How do you handle concurrent elevator requests thread-safely?</h3>
      <p>
        Synchronize on the Elevator object for any operation that reads or modifies pendingFloors and state
        together. The assignment strategy reads elevator state atomically. Alternatively, model each elevator
        as an actor with a dedicated thread and a BlockingQueue of requests — the actor processes requests
        sequentially, eliminating shared-state concurrency issues.
      </p>
    </>
  );
}
