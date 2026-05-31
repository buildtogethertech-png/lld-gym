export default function Content() {
  return (
    <>
      <p>
        Chess Game Low Level Design is an advanced OOP problem asked at Google, Microsoft, and Amazon.
        It tests entity modeling (pieces, board, moves), polymorphism for different piece movement rules,
        and game state management. This guide covers the complete Chess LLD with Java code, class diagram,
        and interview FAQ.
      </p>

      <h2>Why Interviewers Ask Chess Game LLD</h2>
      <ul>
        <li>Can you model 6 different piece types without code duplication (polymorphism)?</li>
        <li>Do you separate move validation from move execution?</li>
        <li>Can you design a clean Board class that does not duplicate piece logic?</li>
        <li>Do you use the Command pattern for move history (undo/replay)?</li>
        <li>Can you detect Check, Checkmate, and Stalemate conditions?</li>
      </ul>

      <h2>Functional Requirements</h2>
      <ul>
        <li>Two players take turns — White moves first</li>
        <li>Each piece type has unique movement rules (King, Queen, Rook, Bishop, Knight, Pawn)</li>
        <li>Validate moves — cannot move to occupied same-color square or leave King in check</li>
        <li>Detect Check (King is under attack), Checkmate (no valid moves), Stalemate (no moves, not in check)</li>
        <li>Support special moves: castling, en passant, pawn promotion</li>
        <li>Move history for replay and undo</li>
      </ul>

      <h2>Non-Functional Requirements</h2>
      <ul>
        <li>Adding a new piece type must not change Board or existing pieces (OCP)</li>
        <li>Move validation must be O(1) or O(board size) — not exponential</li>
        <li>Command pattern for moves enables undo without re-deriving state</li>
      </ul>

      <h2>Core Entities — Chess LLD Class Design</h2>
      <ul>
        <li><strong>Board</strong> — 8x8 grid of Cells; initializes with starting position</li>
        <li><strong>Cell</strong> — row, col, piece (nullable)</li>
        <li><strong>Piece</strong> — abstract; color, position; getValidMoves() abstract</li>
        <li><strong>King, Queen, Rook, Bishop, Knight, Pawn</strong> — each overrides getValidMoves()</li>
        <li><strong>Move</strong> — from, to, piece, capturedPiece (Command)</li>
        <li><strong>Player</strong> — color, list of active pieces</li>
        <li><strong>Game</strong> — board, two players, currentTurn, moveHistory, status</li>
      </ul>

      <h2>Text-Based Class Diagram</h2>
      <pre>{`Board
+-- cells: Cell[8][8]
+-- getPiece(row, col): Piece
+-- movePiece(move): void
+-- isUnderAttack(row, col, color): boolean

Cell
+-- row: int, col: int
+-- piece: Piece (nullable)

Piece (abstract)
+-- color: Color (WHITE/BLACK)
+-- row: int, col: int
+-- getValidMoves(board): List<Move>
+-- canMoveTo(board, row, col): boolean

King    extends Piece
Queen   extends Piece
Rook    extends Piece
Bishop  extends Piece
Knight  extends Piece
Pawn    extends Piece

Move (Command)
+-- fromRow, fromCol: int
+-- toRow, toCol: int
+-- piece: Piece
+-- capturedPiece: Piece (nullable)
+-- isSpecial: boolean  (castling, en passant)

Game
+-- board: Board
+-- white: Player, black: Player
+-- currentTurn: Color
+-- moveHistory: Deque<Move>
+-- status: GameStatus (ACTIVE/CHECK/CHECKMATE/STALEMATE)`}</pre>

      <h2>Piece Movement — Polymorphism in Java</h2>
      <pre>{`public abstract class Piece {
    protected Color color;
    protected int row, col;

    public abstract List<Move> getValidMoves(Board board);

    protected boolean isInBounds(int r, int c) {
        return r >= 0 && r < 8 && c >= 0 && c < 8;
    }

    protected boolean canOccupy(Board board, int r, int c) {
        Piece target = board.getPiece(r, c);
        return target == null || target.getColor() != this.color;
    }
}

public class Knight extends Piece {
    private static final int[][] OFFSETS = {
        {-2,-1},{-2,1},{-1,-2},{-1,2},
        {1,-2},{1,2},{2,-1},{2,1}
    };

    @Override
    public List<Move> getValidMoves(Board board) {
        List<Move> moves = new ArrayList<>();
        for (int[] off : OFFSETS) {
            int r = row + off[0], c = col + off[1];
            if (isInBounds(r, c) && canOccupy(board, r, c)) {
                moves.add(new Move(row, col, r, c, this, board.getPiece(r, c)));
            }
        }
        return moves;
    }
}

public class Rook extends Piece {
    @Override
    public List<Move> getValidMoves(Board board) {
        List<Move> moves = new ArrayList<>();
        int[][] directions = {{0,1},{0,-1},{1,0},{-1,0}};
        for (int[] dir : directions) {
            int r = row + dir[0], c = col + dir[1];
            while (isInBounds(r, c)) {
                Piece target = board.getPiece(r, c);
                if (target == null) {
                    moves.add(new Move(row, col, r, c, this, null));
                } else {
                    if (target.getColor() != this.color)
                        moves.add(new Move(row, col, r, c, this, target));
                    break; // blocked
                }
                r += dir[0]; c += dir[1];
            }
        }
        return moves;
    }
}

public class Pawn extends Piece {
    @Override
    public List<Move> getValidMoves(Board board) {
        List<Move> moves = new ArrayList<>();
        int dir = (color == Color.WHITE) ? -1 : 1; // white moves up (decreasing row)
        int startRow = (color == Color.WHITE) ? 6 : 1;

        // One step forward
        if (isInBounds(row + dir, col) && board.getPiece(row + dir, col) == null) {
            moves.add(new Move(row, col, row + dir, col, this, null));
            // Two steps from starting position
            if (row == startRow && board.getPiece(row + 2 * dir, col) == null)
                moves.add(new Move(row, col, row + 2 * dir, col, this, null));
        }
        // Diagonal captures
        for (int dc : new int[]{-1, 1}) {
            int r = row + dir, c = col + dc;
            if (isInBounds(r, c)) {
                Piece target = board.getPiece(r, c);
                if (target != null && target.getColor() != this.color)
                    moves.add(new Move(row, col, r, c, this, target));
            }
        }
        return moves;
    }
}`}</pre>

      <h2>Game — Check and Checkmate Detection</h2>
      <pre>{`public class Game {
    private final Board board;
    private Color currentTurn = Color.WHITE;
    private final Deque<Move> moveHistory = new ArrayDeque<>();
    private GameStatus status = GameStatus.ACTIVE;

    public boolean makeMove(Move move) {
        // 1. Validate the piece belongs to the current player
        if (move.getPiece().getColor() != currentTurn) return false;

        // 2. Check the move is in the piece's valid move list
        List<Move> valid = move.getPiece().getValidMoves(board);
        if (valid.stream().noneMatch(m -> m.getTo().equals(move.getTo()))) return false;

        // 3. Execute move on the board
        board.applyMove(move);
        moveHistory.push(move);

        // 4. Check if the moving player left their own King in check (illegal)
        if (board.isKingInCheck(currentTurn)) {
            board.undoMove(move); // revert
            moveHistory.pop();
            return false;
        }

        // 5. Switch turn and check opponent status
        currentTurn = currentTurn.opposite();
        if (board.isKingInCheck(currentTurn)) {
            status = hasAnyValidMove(currentTurn) ? GameStatus.CHECK : GameStatus.CHECKMATE;
        } else if (!hasAnyValidMove(currentTurn)) {
            status = GameStatus.STALEMATE;
        }
        return true;
    }

    private boolean hasAnyValidMove(Color color) {
        return board.getPieces(color).stream()
            .anyMatch(p -> !p.getValidMoves(board).isEmpty());
    }

    public void undoMove() {
        if (!moveHistory.isEmpty()) {
            board.undoMove(moveHistory.pop());
            currentTurn = currentTurn.opposite();
            status = GameStatus.ACTIVE;
        }
    }
}`}</pre>

      <h2>Key Design Decisions</h2>
      <ul>
        <li>
          <strong>Polymorphism for piece movement:</strong> Each piece subclass overrides getValidMoves().
          Game and Board never check piece types — they call getValidMoves() on any Piece. Adding a new
          fairy chess piece is a new subclass only.
        </li>
        <li>
          <strong>Command pattern for moves:</strong> Each Move stores the piece, from/to positions, and
          captured piece. undoMove() restores the captured piece and moves the piece back. No need to
          re-derive state from scratch.
        </li>
        <li>
          <strong>Check validation by trial:</strong> Apply the move, check if King is in check, then
          revert if illegal. This is simpler than pre-computing all attack lines and handles all edge
          cases including discovered checks.
        </li>
      </ul>

      <h2>FAQ — Chess Game Low Level Design</h2>

      <h3>What design patterns are used in Chess LLD?</h3>
      <p>
        <strong>Polymorphism</strong> (piece hierarchy — each piece overrides getValidMoves),
        <strong>Command</strong> (Move object stores everything needed for undo/replay), and
        <strong>Iterator</strong> (board traversal for attack detection). The Board follows SRP — it
        manages piece positions but does not contain movement rules.
      </p>

      <h3>How do you detect checkmate in Chess LLD?</h3>
      <p>
        After each move: (1) check if the opponent's King is under attack (isKingInCheck). If yes, (2)
        try every possible move for every opponent piece. If no move results in the King being safe,
        it is checkmate. If the King is not in check but there are no valid moves, it is stalemate.
      </p>

      <h3>How do you implement castling in Chess LLD?</h3>
      <p>
        Add a hasMoved flag to King and Rook. Castling is valid if: King has not moved, the chosen Rook
        has not moved, no pieces between them, and the King does not pass through or land on an attacked
        square. Model it as a special Move that moves both the King and Rook atomically in applyMove().
      </p>

      <h3>How do you handle pawn promotion?</h3>
      <p>
        When a Pawn reaches the last rank, prompt the player to choose a replacement piece (Queen, Rook,
        Bishop, Knight). In applyMove(), replace the Pawn on the board with the chosen piece. Store the
        promoted piece in the Move object for undo support.
      </p>
    </>
  );
}
