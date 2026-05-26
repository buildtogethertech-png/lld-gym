export default function Content() {
  return (
    <>
      <p>
        Library Management System is a classic beginner-to-intermediate Low Level Design problem that covers
        entity design, fine calculation, and notification on overdue books. It is frequently asked at entry-
        to mid-level SDE interviews at product and service companies. This guide covers the complete Library
        Management LLD with Java code, class diagram, and FAQ.
      </p>

      <h2>Why Interviewers Ask Library Management LLD</h2>
      <p>
        The library problem is a test of clean entity modeling and business rule encoding. Interviewers
        want to see:
      </p>
      <ul>
        <li>Can you model the relationship between Book, BookItem (physical copy), and Member cleanly?</li>
        <li>Do you design a fine calculation rule as a Strategy, not hardcoded constants?</li>
        <li>Do you track the borrowing state: BORROWED → RETURNED / OVERDUE?</li>
        <li>Can you design a search function — by title, author, ISBN, category?</li>
        <li>Do you use Observer to notify members when a reserved book becomes available?</li>
      </ul>

      <h2>Functional Requirements</h2>
      <ul>
        <li>Members can search for books by title, author, ISBN, or genre</li>
        <li>Members can borrow a book for up to 14 days</li>
        <li>Members can return a book — fine calculated if overdue</li>
        <li>Members can reserve a book currently on loan — notified when available</li>
        <li>Librarians can add/remove books and manage member accounts</li>
        <li>A member can borrow at most 5 books simultaneously</li>
        <li>System sends overdue reminders to members</li>
      </ul>

      <h2>Non-Functional Requirements</h2>
      <ul>
        <li>Fine calculation must be consistent and auditable — store fine breakdown per loan</li>
        <li>Book availability must be accurate under concurrent borrow requests</li>
        <li>Adding a new fine policy (e.g., tiered fines) must not change BorrowingService</li>
      </ul>

      <h2>Core Entities — Library Management LLD Class Design</h2>
      <ul>
        <li><strong>Book</strong> — ISBN, title, author, publisher, genre, total copies</li>
        <li><strong>BookItem</strong> — barcode, book (FK), status (AVAILABLE/BORROWED/RESERVED/LOST)</li>
        <li><strong>Member</strong> — id, name, email, membership type, activeLoanCount</li>
        <li><strong>Loan</strong> — id, bookItem, member, borrowDate, dueDate, returnDate, fine</li>
        <li><strong>Reservation</strong> — member, book (not bookItem), reservedAt, status</li>
        <li><strong>FinePolicy</strong> — interface; DailyFinePolicy, TieredFinePolicy implement it</li>
        <li><strong>BorrowingService</strong> — borrow, return, calculate fine</li>
        <li><strong>NotificationService</strong> — Observer; notifies members of availability/overdue</li>
        <li><strong>Catalog</strong> — search books by multiple criteria</li>
      </ul>

      <h2>Text-Based Class Diagram</h2>
      <pre>{`Book
+-- isbn: String (unique)
+-- title, author, publisher, genre: String
+-- items: List<BookItem>

BookItem
+-- barcode: String (unique)
+-- book: Book
+-- status: BookItemStatus (AVAILABLE/BORROWED/RESERVED/LOST)

Member
+-- id, name, email: String
+-- membershipType: MemberType (STUDENT/FACULTY/PUBLIC)
+-- activeLoanCount: int
+-- maxBorrowLimit: int  // derived from membershipType

Loan
+-- id: String
+-- bookItem: BookItem, member: Member
+-- borrowDate, dueDate, returnDate: LocalDate
+-- fine: double
+-- status: LoanStatus (ACTIVE/RETURNED/OVERDUE)

Reservation
+-- id, member: Member, book: Book
+-- reservedAt: LocalDateTime
+-- status: ReservationStatus (PENDING/FULFILLED/CANCELLED)

FinePolicy (interface)
+-- calculateFine(loan): double

DailyFinePolicy implements FinePolicy
TieredFinePolicy implements FinePolicy`}</pre>

      <h2>Fine Calculation — Strategy Pattern</h2>
      <pre>{`public interface FinePolicy {
    double calculateFine(Loan loan);
}

// Flat rate per day overdue
public class DailyFinePolicy implements FinePolicy {
    private final double ratePerDay;

    public DailyFinePolicy(double ratePerDay) {
        this.ratePerDay = ratePerDay;
    }

    @Override
    public double calculateFine(Loan loan) {
        if (loan.getReturnDate() == null || !loan.isOverdue()) return 0.0;
        long daysOverdue = ChronoUnit.DAYS.between(loan.getDueDate(), loan.getReturnDate());
        return Math.max(0, daysOverdue) * ratePerDay;
    }
}

// Tiered: higher rate after 7 days overdue
public class TieredFinePolicy implements FinePolicy {
    private static final double BASE_RATE = 2.0;
    private static final double HIGH_RATE = 5.0;
    private static final int TIER_THRESHOLD = 7;

    @Override
    public double calculateFine(Loan loan) {
        if (loan.getReturnDate() == null || !loan.isOverdue()) return 0.0;
        long overdueDays = ChronoUnit.DAYS.between(loan.getDueDate(), loan.getReturnDate());
        if (overdueDays <= 0) return 0.0;

        long tier1Days = Math.min(overdueDays, TIER_THRESHOLD);
        long tier2Days = Math.max(0, overdueDays - TIER_THRESHOLD);
        return (tier1Days * BASE_RATE) + (tier2Days * HIGH_RATE);
    }
}`}</pre>

      <h2>BorrowingService — Borrow and Return</h2>
      <pre>{`public class BorrowingService {
    private final BookItemRepository itemRepo;
    private final LoanRepository loanRepo;
    private final ReservationRepository reservationRepo;
    private final FinePolicy finePolicy;
    private final NotificationService notificationService;

    private static final int MAX_BORROW_DAYS = 14;

    public Loan borrowBook(String barcode, String memberId) {
        Member member = memberRepo.findById(memberId);
        if (member.getActiveLoanCount() >= member.getMaxBorrowLimit())
            throw new BorrowLimitExceededException("Member has reached borrow limit");

        BookItem item = itemRepo.findByBarcode(barcode);
        synchronized (item) { // prevent race on same item
            if (item.getStatus() != BookItemStatus.AVAILABLE)
                throw new BookNotAvailableException(barcode);

            item.setStatus(BookItemStatus.BORROWED);
            itemRepo.save(item);
        }

        member.incrementActiveLoanCount();
        memberRepo.save(member);

        LocalDate today = LocalDate.now();
        Loan loan = new Loan(UUID.randomUUID().toString(), item, member,
            today, today.plusDays(MAX_BORROW_DAYS), null, 0.0, LoanStatus.ACTIVE);
        return loanRepo.save(loan);
    }

    public Loan returnBook(String barcode, String memberId) {
        BookItem item = itemRepo.findByBarcode(barcode);
        Loan loan = loanRepo.findActiveByItemAndMember(barcode, memberId);

        loan.setReturnDate(LocalDate.now());
        double fine = finePolicy.calculateFine(loan);
        loan.setFine(fine);
        loan.setStatus(LoanStatus.RETURNED);
        loanRepo.save(loan);

        member.decrementActiveLoanCount();
        memberRepo.save(member);

        // Check if anyone reserved this book
        reservationRepo.findNextPending(item.getBook().getIsbn()).ifPresent(reservation -> {
            item.setStatus(BookItemStatus.RESERVED);
            notificationService.notifyAvailable(reservation.getMember(), item.getBook());
            reservation.setStatus(ReservationStatus.FULFILLED);
            reservationRepo.save(reservation);
        });

        if (item.getStatus() != BookItemStatus.RESERVED) {
            item.setStatus(BookItemStatus.AVAILABLE);
        }
        itemRepo.save(item);
        return loan;
    }
}`}</pre>

      <h2>Catalog Search</h2>
      <pre>{`public class Catalog {
    private final BookRepository bookRepo;

    public List<Book> searchByTitle(String title) {
        return bookRepo.findByTitleContainingIgnoreCase(title);
    }

    public List<Book> searchByAuthor(String author) {
        return bookRepo.findByAuthorContainingIgnoreCase(author);
    }

    public Optional<Book> searchByIsbn(String isbn) {
        return bookRepo.findByIsbn(isbn);
    }

    public List<Book> searchByGenre(String genre) {
        return bookRepo.findByGenre(genre);
    }

    public List<Book> getAvailableBooks() {
        return bookRepo.findBooksWithAvailableItems();
    }
}`}</pre>

      <h2>Key Design Decisions</h2>
      <ul>
        <li>
          <strong>Book vs BookItem:</strong> A Book represents the logical title (one ISBN). A BookItem
          is a physical copy (one barcode, one borrowable unit). Without this distinction, the system
          cannot track which specific copy was borrowed or report accurate availability counts.
        </li>
        <li>
          <strong>Fine as Strategy, not constant:</strong> Different member types may have different fine
          rates. Academic libraries have tiered fines. Encoding the rate as a constant inside Loan forces
          changes to Loan for every policy update. Strategy keeps Loan clean.
        </li>
        <li>
          <strong>Synchronized on BookItem for borrow:</strong> Two librarians at different terminals
          could issue the same copy simultaneously. Synchronizing on the item object (not a global lock)
          scopes the contention to one copy without blocking unrelated borrow operations.
        </li>
        <li>
          <strong>Reservation on Book, not BookItem:</strong> Members reserve a title, not a specific
          copy. On return, the system picks the next pending reservation for that book and assigns the
          returned copy to it. The member gets any available copy, not a specific one.
        </li>
      </ul>

      <h2>Common Follow-Up Questions</h2>
      <ul>
        <li>
          <strong>"How do you handle a member losing a book?"</strong> — Add a LOST status to BookItem.
          Charge a replacement fee (configurable per book). Decrement the member's active loan count.
          Update the library's total available copies.
        </li>
        <li>
          <strong>"How do you send overdue reminders?"</strong> — A scheduled job runs daily. It queries
          Loan where status=ACTIVE and dueDate is before today. For each, it calls
          notificationService.sendOverdueReminder(loan). The NotificationService can send email, SMS,
          or push notifications (Observer pattern).
        </li>
        <li>
          <strong>"How do you handle membership renewal and expiry?"</strong> — Add membershipExpiry to
          Member. BorrowingService checks validity before allowing borrow. Expired memberships cannot
          borrow but can return (to collect fines).
        </li>
      </ul>

      <h2>FAQ — Library Management System Low Level Design</h2>

      <h3>What design patterns are used in Library Management LLD?</h3>
      <p>
        The primary patterns are <strong>Strategy</strong> (FinePolicy — DailyFinePolicy, TieredFinePolicy),
        <strong>Observer</strong> (notify members when a reserved book becomes available), and
        <strong>Repository</strong> (BookRepository, LoanRepository, ReservationRepository).
      </p>

      <h3>What is the difference between Book and BookItem?</h3>
      <p>
        A Book is the logical title — it has one ISBN, one author, and one genre. A BookItem is a
        physical copy of that book — it has a unique barcode, a status (AVAILABLE/BORROWED), and tracks
        which member currently has it. A library might have 5 BookItems for one Book.
      </p>

      <h3>How do you calculate fines in a library system?</h3>
      <p>
        On return, compute the number of days between dueDate and returnDate. If positive, multiply by
        the fine rate. Use a Strategy so the rate can vary by membership type or library policy. Store
        the calculated fine on the Loan record for auditing.
      </p>

      <h3>How do book reservations work?</h3>
      <p>
        A Reservation links a Member to a Book (not a specific copy) with a PENDING status. When any
        copy of that book is returned, the system checks for the oldest pending reservation and notifies
        that member. The copy is held in RESERVED status for 48 hours for that member to collect.
      </p>
    </>
  );
}
