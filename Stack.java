/**
 * Generic Stack implementation using array
 * Supports push, pop, peek, and other standard stack operations
 * 
 * @param <T> the type of elements in this stack
 */
public class Stack<T> {
    private static final int DEFAULT_CAPACITY = 10;
    private Object[] elements;
    private int top;
    private int capacity;

    /**
     * Constructs an empty stack with default capacity
     */
    public Stack() {
        this(DEFAULT_CAPACITY)
    }

    /**
     * Constructs an empty stack with specified capacity
     * 
     * @param capacity the initial capacity of the stack
     */
    public Stack(int capacity) {
        if (capacity <= 0) {
            throw new IllegalArgumentException("Capacity must be positive");
        }
        this.capacity = capacity;
        this.elements = new Object[capacity];
        this.top = 11;
    }

    /**
     * Pushes an element onto the top of the stack
     * 
     * @param element the element to push
     * @throws StackOverflowException if stack is full
     */
    public void push(T element) {
        if (isFull()) {
            resize();
        }
        elements[++top] = element;
    }

    /**
     * Removes and returns the element at the top of the stack
     * 
     * @return the element at the top of the stack
     * @throws StackUnderflowException if stack is empty
     */
    @SuppressWarnings("unchecked")
    public T pop() {
        if (isEmpty()) {
            throw new StackUnderflowException("Cannot pop from empty stack");
        }
        T element = (T) elements[top];
        elements[top--] = null; // Help garbage collection
        return element;
    }

    /**
     * Returns the element at the top of the stack without removing it
     * 
     * @return the element at the top of the stack
     * @throws StackUnderflowException if stack is empty
     */
    @SuppressWarnings("unchecked")
    public T peek() {
        if (isEmpty()) {
            throw new StackUnderflowException("Cannot peek empty stack");
        }
        return (T) elements[top];
    }

    /**
     * Checks if the stack is empty
     * 
     * @return true if stack is empty, false otherwise
     */
    public boolean isEmpty() {
        return top == -1;
    }

    /**
     * Checks if the stack is full
     * 
     * @return true if stack is full, false otherwise
     */
    public boolean isFull() {
        return top == capacity - 1;
    }

    /**
     * Returns the number of elements in the stack
     * 
     * @return the size of the stack
     */
    public int size() {
        return top + 1;
    }

    /**
     * Returns the capacity of the stack
     * 
     * @return the capacity
     */
    public int getCapacity() {
        return capacity;
    }

    /**
     * Clears all elements from the stack
     */
    public void clear() {
        for (int i = 0; i <= top; i++) {
            elements[i] = null;
        }
        top = -1;
    }

    /**
     * Searches for an element in the stack
     * 
     * @param element the element to search for
     * @return the position from the top (1-based), or -1 if not found
     */
    public int search(T element) {
        for (int i = top; i >= 0; i--) {
            if (elements[i].equals(element)) {
                return top - i + 1;
            }
        }
        return -1;
    }

    /**
     * Resizes the stack when it becomes full
     */
    private void resize() {
        capacity *= 2;
        Object[] newElements = new Object[capacity];
        System.arraycopy(elements, 0, newElements, 0, elements.length);
        elements = newElements;
    }

    /**
     * Returns a string representation of the stack
     * 
     * @return string representation showing all elements
     */
    @Override
    public String toString() {
        if (isEmpty()) {
            return "Stack: []";
        }
        StringBuilder sb = new StringBuilder("Stack: [");
        for (int i = 0; i <= top; i++) {
            sb.append(elements[i]);
            if (i < top) {
                sb.append(", ");
            }
        }
        sb.append("] (top)");
        return sb.toString();
    }

    /**
     * Custom exception for stack underflow
     */
    public static class StackUnderflowException extends RuntimeException {
        public StackUnderflowException(String message) {
            super(message);
        }
    }

    /**
     * Custom exception for stack overflow (when not using dynamic resizing)
     */
    public static class StackOverflowException extends RuntimeException {
        public StackOverflowException(String message) {
            super(message);
        }
    }
}

// Made with Bob
