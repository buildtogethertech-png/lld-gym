export default function Content() {
  return (
    <>
      <p>The Library Management System is a classic beginner-to-intermediate LLD problem that tests your ability to model relationships, lifecycle states, and notification patterns. It's commonly asked in SDE-1 and SDE-2 interviews at product-based companies.</p>
      <h2>Core Entities</h2>
      <ul>
        <li><strong>Book</strong> — ISBN, title, author, genre (one Book can have many BookItems)</li>
        <li><strong>BookItem</strong> — a physical copy of a Book, has a barcode and status</li>
        <li><strong>Member</strong> — can borrow up to 3 books, has active loans</li>
        <li><strong>Librarian</strong> — manages inventory</li>
        <li><strong>Loan</strong> — member, bookItem, borrowDate, dueDate, returnDate</li>
        <li><strong>Reservation</strong> — a member waiting for a BookItem to become available</li>
        <li><strong>Fine</strong> — calculated when a book is returned late</li>
      </ul>
      <h2>Key Distinction: Book vs BookItem</h2>
      <pre>{`class Book {
  isbn: string;
  title: string;
  author: string;
  copies: BookItem[];  // multiple physical copies
}

class BookItem {
  barcode: string;
  book: Book;
  status: BookItemStatus;  // AVAILABLE | BORROWED | RESERVED | LOST
}`}</pre>
      <h2>Loan Management</h2>
      <pre>{`class LoanService {
  borrowBook(member: Member, bookItem: BookItem): Loan {
    if (member.activeLoans >= 3) throw new Error("Borrow limit reached");
    if (bookItem.status !== BookItemStatus.AVAILABLE) throw new Error("Not available");

    bookItem.status = BookItemStatus.BORROWED;
    const due = new Date();
    due.setDate(due.getDate() + 14); // 14-day borrow period

    return this.loanRepo.create({ member, bookItem, dueDate: due });
  }

  returnBook(loan: Loan): Fine | null {
    loan.bookItem.status = BookItemStatus.AVAILABLE;
    loan.returnDate = new Date();

    const daysLate = daysBetween(loan.dueDate, loan.returnDate);
    if (daysLate > 0) return new Fine(loan, daysLate * 5); // ₹5/day

    this.notifyReservations(loan.bookItem); // Observer pattern
    return null;
  }
}`}</pre>
      <h2>Observer for Reservations</h2>
      <pre>{`class LoanService {
  private notifyReservations(bookItem: BookItem) {
    const next = this.reservationRepo.findFirst(bookItem.book.isbn);
    if (next) {
      bookItem.status = BookItemStatus.RESERVED;
      this.notificationService.notify(next.member, "Your reserved book is available!");
    }
  }
}`}</pre>
      <h2>Common Questions</h2>
      <ul>
        <li>"How do you handle renewals?" → Extend dueDate if no active reservation on the book</li>
        <li>"What if a member has unpaid fines?" → Block borrowing until fine is cleared</li>
        <li>"How do you search books?" → Index by title, author, ISBN; use BookCatalog service</li>
      </ul>
    </>
  );
}
