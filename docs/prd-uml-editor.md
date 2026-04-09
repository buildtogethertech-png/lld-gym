# PRD — UML Class Diagram Practice Tool

## 1. Overview

Build a simple UML Class Diagram editor where users can practice Low Level Design class diagrams.

The tool will allow users to:
- Create classes
- Add attributes and methods
- Connect classes with relationships
- Practice designing systems visually

Initially a standalone practice page at `/uml-practice`. Later integrated with LLD problems + AI review.

---

## 2. Goals

**Primary:**
- Allow users to quickly create UML class diagrams
- Keep UI very simple and beginner friendly
- Support core LLD interview use cases
- Enable future AI review of diagrams

**Non-goals (for now):**
- Professional diagram editor
- Sequence diagrams
- Complex styling
- Collaboration

---

## 3. User Flow

1. User opens `/uml-practice`
2. Blank canvas with toolbar: `+ Class`, `+ Interface`, `Connect`, `Delete`
3. User creates classes (e.g. Vehicle, ParkingLot, ParkingSpot, Ticket)
4. User connects relationships (e.g. Car → Vehicle inheritance)
5. Save or export diagram
6. *(Future)* Submit for AI Review

---

## 4. Core Features

### 4.1 Canvas
Drag-and-drop canvas with zoom and pan.

### 4.2 Class Node
```
------------------
ClassName
------------------
+ attribute: type
------------------
+ method()
------------------
```

### 4.3 Interface Node
```
<<interface>>
PaymentStrategy
```

### 4.4 Edit Class
- Add/edit attributes: `+ licensePlate`, `+ vehicleType`
- Add/edit methods: `+ park()`, `+ unpark()`

### 4.5 Relationships
| Type | Arrow | Example |
|------|-------|---------|
| Association | Simple line | Order → Payment |
| Inheritance | Triangle arrow | Car → Vehicle |
| Aggregation | Diamond | ParkingFloor ◇ ParkingSpot |
| Composition | Filled diamond | Order ◆ OrderItem |

### 4.6 Delete
Select node or edge → press Delete.

---

## 5. UI Layout

```
---------------------------------------
Toolbar: +Class  +Interface  Connect  Delete  [Relationship type]
---------------------------------------
Canvas (drag, zoom, pan)
---------------------------------------
Side panel: Selected Class Editor
```

---

## 6. Future: Problem Integration

Problem page layout:
```
[Code] [Diagram] [AI Review]
```
Diagram tab loads same UML editor.

---

## 7. Future: AI Review

Diagram stored as JSON:
```json
{
  "classes": [
    { "name": "Vehicle" },
    { "name": "Car", "extends": "Vehicle" }
  ],
  "relations": [
    { "from": "ParkingLot", "to": "ParkingFloor" }
  ]
}
```

AI reviews: SOLID violations, incorrect abstraction, missing interfaces, tight coupling.

---

## 8. Technical Stack

- **React Flow** (`@xyflow/react`) — nodes, edges, drag, zoom, pan
- Custom node type: `ClassNode`
- Edge types: association, inheritance, aggregation, composition

### Data Model

**Node:**
```ts
{ id, type, name, attributes: string[], methods: string[] }
```

**Edge:**
```ts
{ source, target, type: "association" | "inheritance" | "aggregation" | "composition" }
```

---

## 9. MVP Scope

- ✅ Class nodes
- ✅ Interface nodes
- ✅ Connect nodes
- ✅ Drag nodes
- ✅ Delete nodes
- ✅ Edit class name, attributes, methods inline
- ✅ Relationship type selector

---

## 10. Future Improvements

- Save diagram (localStorage + DB)
- Export PNG
- Share diagram link
- AI diagram review
- Templates: Parking Lot, Splitwise, Elevator System

---

## 11. Success Metrics

- Number of diagrams created
- Time spent on canvas
- Diagram submissions

---

## Philosophy

> The tool should feel like a whiteboard for LLD interviews. Fast and simple. Not like Lucidchart or Excalidraw.
