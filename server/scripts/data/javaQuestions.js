/**
 * Seed questions for Java track (6 levels x 5 questions = 30 questions)
 * Curriculum:
 * Level 1: Syntax & Scanner
 * Level 2: Branching & Logic
 * Level 3: Looping & Numbers
 * Level 4: Arrays & Strings
 * Level 5: Methods & Recursion
 * Level 6: Classes & Collections
 */

const javaQuestions = [
  // =========================================================================
  // LEVEL 1: Syntax & Scanner
  // =========================================================================
  {
    languageSlug: 'java',
    levelNumber: 1,
    title: 'Product of Two Numbers',
    statement: 'Given two integers A and B, compute and print their product (A * B) using standard Java output.',
    input_format: 'A single line containing two space-separated integers A and B.',
    output_format: 'Print the product A * B on a single line.',
    constraints_text: '-10^4 <= A, B <= 10^4',
    explanation: 'For 6 and 7, 6 * 7 = 42.',
    samples: [
      { sample_input: '6 7\n', expected_output: '42\n', explanation: '6 * 7 = 42' }
    ],
    test_cases: [
      { test_input: '6 7\n', expected_output: '42\n', is_hidden: false },
      { test_input: '0 100\n', expected_output: '0\n', is_hidden: true },
      { test_input: '-5 8\n', expected_output: '-40\n', is_hidden: true },
      { test_input: '-9 -9\n', expected_output: '81\n', is_hidden: true }
    ],
    starter_code: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNextLong()) {
            long a = sc.nextLong();
            long b = sc.nextLong();
            System.out.println(a * b);
        }
    }
}
`
  },
  {
    languageSlug: 'java',
    levelNumber: 1,
    title: 'Perimeter of a Square',
    statement: 'Given the side length S of a square, calculate and print its perimeter (4 * S).',
    input_format: 'A single integer S.',
    output_format: 'Print the perimeter.',
    constraints_text: '1 <= S <= 10^5',
    explanation: 'For side length 12, perimeter is 4 * 12 = 48.',
    samples: [
      { sample_input: '12\n', expected_output: '48\n', explanation: '4 * 12 = 48' }
    ],
    test_cases: [
      { test_input: '12\n', expected_output: '48\n', is_hidden: false },
      { test_input: '1\n', expected_output: '4\n', is_hidden: true },
      { test_input: '25\n', expected_output: '100\n', is_hidden: true }
    ],
    starter_code: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNextLong()) {
            long s = sc.nextLong();
            System.out.println(4 * s);
        }
    }
}
`
  },
  {
    languageSlug: 'java',
    levelNumber: 1,
    title: 'Convert Minutes to Seconds',
    statement: 'Given an integer number of minutes M, convert and print the total seconds (M * 60).',
    input_format: 'A single integer M.',
    output_format: 'Print the equivalent seconds.',
    constraints_text: '0 <= M <= 10^6',
    explanation: '5 minutes equals 5 * 60 = 300 seconds.',
    samples: [
      { sample_input: '5\n', expected_output: '300\n', explanation: '5 * 60 = 300' }
    ],
    test_cases: [
      { test_input: '5\n', expected_output: '300\n', is_hidden: false },
      { test_input: '0\n', expected_output: '0\n', is_hidden: true },
      { test_input: '60\n', expected_output: '3600\n', is_hidden: true }
    ],
    starter_code: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNextLong()) {
            long m = sc.nextLong();
            System.out.println(m * 60);
        }
    }
}
`
  },
  {
    languageSlug: 'java',
    levelNumber: 1,
    title: 'Modulo Operation Result',
    statement: 'Given two integers A and B, print the remainder when A is divided by B (A % B).',
    input_format: 'Two space-separated integers A and B.',
    output_format: 'Print A % B on a single line.',
    constraints_text: '1 <= A <= 10^9, 1 <= B <= 10^9',
    explanation: '29 % 7 = 1 because 29 = 4 * 7 + 1.',
    samples: [
      { sample_input: '29 7\n', expected_output: '1\n', explanation: '29 % 7 = 1' }
    ],
    test_cases: [
      { test_input: '29 7\n', expected_output: '1\n', is_hidden: false },
      { test_input: '50 5\n', expected_output: '0\n', is_hidden: true },
      { test_input: '10 15\n', expected_output: '10\n', is_hidden: true }
    ],
    starter_code: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNextLong()) {
            long a = sc.nextLong();
            long b = sc.nextLong();
            System.out.println(a % b);
        }
    }
}
`
  },
  {
    languageSlug: 'java',
    levelNumber: 1,
    title: 'Print Formatted Full Name',
    statement: 'Read two strings from input: firstName on the first line and lastName on the second line. Print them in formatted order: "lastName, firstName".',
    input_format: 'First line contains firstName. Second line contains lastName.',
    output_format: 'Print "lastName, firstName".',
    constraints_text: '1 <= length <= 50',
    explanation: 'Given "John" and "Doe", output is "Doe, John".',
    samples: [
      { sample_input: 'John\nDoe\n', expected_output: 'Doe, John\n', explanation: 'Formatted as Doe, John' }
    ],
    test_cases: [
      { test_input: 'John\nDoe\n', expected_output: 'Doe, John\n', is_hidden: false },
      { test_input: 'Alan\nTuring\n', expected_output: 'Turing, Alan\n', is_hidden: true },
      { test_input: 'Ada\nLovelace\n', expected_output: 'Lovelace, Ada\n', is_hidden: true }
    ],
    starter_code: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNext()) {
            String first = sc.next();
            String last = sc.next();
            System.out.println(last + ", " + first);
        }
    }
}
`
  },

  // =========================================================================
  // LEVEL 2: Branching & Logic
  // =========================================================================
  {
    languageSlug: 'java',
    levelNumber: 2,
    title: 'Check Voting Eligibility',
    statement: 'Given an age A in years, print "ELIGIBLE" if A >= 18, or "NOT ELIGIBLE" otherwise.',
    input_format: 'A single integer A.',
    output_format: 'Print "ELIGIBLE" or "NOT ELIGIBLE".',
    constraints_text: '0 <= A <= 150',
    explanation: 'Age 20 is >= 18, so ELIGIBLE. Age 16 is < 18, so NOT ELIGIBLE.',
    samples: [
      { sample_input: '20\n', expected_output: 'ELIGIBLE\n', explanation: '20 >= 18' },
      { sample_input: '16\n', expected_output: 'NOT ELIGIBLE\n', explanation: '16 < 18' }
    ],
    test_cases: [
      { test_input: '20\n', expected_output: 'ELIGIBLE\n', is_hidden: false },
      { test_input: '16\n', expected_output: 'NOT ELIGIBLE\n', is_hidden: false },
      { test_input: '18\n', expected_output: 'ELIGIBLE\n', is_hidden: true },
      { test_input: '0\n', expected_output: 'NOT ELIGIBLE\n', is_hidden: true },
      { test_input: '85\n', expected_output: 'ELIGIBLE\n', is_hidden: true }
    ],
    starter_code: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNextInt()) {
            int age = sc.nextInt();
            if (age >= 18) {
                System.out.println("ELIGIBLE");
            } else {
                System.out.println("NOT ELIGIBLE");
            }
        }
    }
}
`
  },
  {
    languageSlug: 'java',
    levelNumber: 2,
    title: 'Find Absolute Value',
    statement: 'Given an integer N, compute and print its absolute value |N| without using Math.abs.',
    input_format: 'A single integer N.',
    output_format: 'Print |N|.',
    constraints_text: '-10^9 <= N <= 10^9',
    explanation: '|-25| = 25. |30| = 30.',
    samples: [
      { sample_input: '-25\n', expected_output: '25\n', explanation: 'Absolute value' }
    ],
    test_cases: [
      { test_input: '-25\n', expected_output: '25\n', is_hidden: false },
      { test_input: '30\n', expected_output: '30\n', is_hidden: true },
      { test_input: '0\n', expected_output: '0\n', is_hidden: true }
    ],
    starter_code: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNextLong()) {
            long n = sc.nextLong();
            if (n < 0) n = -n;
            System.out.println(n);
        }
    }
}
`
  },
  {
    languageSlug: 'java',
    levelNumber: 2,
    title: 'Compare Two Integers',
    statement: 'Given two integers A and B, print "GREATER" if A > B, "SMALLER" if A < B, or "EQUAL" if A == B.',
    input_format: 'Two space-separated integers A and B.',
    output_format: 'Print "GREATER", "SMALLER", or "EQUAL".',
    constraints_text: '-10^9 <= A, B <= 10^9',
    explanation: '10 > 5 so GREATER.',
    samples: [
      { sample_input: '10 5\n', expected_output: 'GREATER\n', explanation: '10 is greater than 5' },
      { sample_input: '3 8\n', expected_output: 'SMALLER\n', explanation: '3 is smaller than 8' }
    ],
    test_cases: [
      { test_input: '10 5\n', expected_output: 'GREATER\n', is_hidden: false },
      { test_input: '3 8\n', expected_output: 'SMALLER\n', is_hidden: false },
      { test_input: '42 42\n', expected_output: 'EQUAL\n', is_hidden: true },
      { test_input: '-5 -1\n', expected_output: 'SMALLER\n', is_hidden: true }
    ],
    starter_code: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNextLong()) {
            long a = sc.nextLong();
            long b = sc.nextLong();
            if (a > b) System.out.println("GREATER");
            else if (a < b) System.out.println("SMALLER");
            else System.out.println("EQUAL");
        }
    }
}
`
  },
  {
    languageSlug: 'java',
    levelNumber: 2,
    title: 'Identify Triangle Type',
    statement: 'Given three side lengths A, B, and C of a triangle, print "EQUILATERAL" if all sides are equal, "ISOSCELES" if exactly two sides are equal, or "SCALENE" if all three sides are distinct.',
    input_format: 'Three space-separated integers A, B, and C.',
    output_format: 'Print "EQUILATERAL", "ISOSCELES", or "SCALENE".',
    constraints_text: '1 <= A, B, C <= 1000',
    explanation: '5 5 5 is EQUILATERAL. 5 5 8 is ISOSCELES. 3 4 5 is SCALENE.',
    samples: [
      { sample_input: '5 5 5\n', expected_output: 'EQUILATERAL\n', explanation: 'All sides equal' },
      { sample_input: '5 5 8\n', expected_output: 'ISOSCELES\n', explanation: 'Two sides equal' }
    ],
    test_cases: [
      { test_input: '5 5 5\n', expected_output: 'EQUILATERAL\n', is_hidden: false },
      { test_input: '5 5 8\n', expected_output: 'ISOSCELES\n', is_hidden: false },
      { test_input: '3 4 5\n', expected_output: 'SCALENE\n', is_hidden: true },
      { test_input: '7 9 7\n', expected_output: 'ISOSCELES\n', is_hidden: true }
    ],
    starter_code: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNextInt()) {
            int a = sc.nextInt();
            int b = sc.nextInt();
            int c = sc.nextInt();
            if (a == b && b == c) {
                System.out.println("EQUILATERAL");
            } else if (a == b || b == c || a == c) {
                System.out.println("ISOSCELES");
            } else {
                System.out.println("SCALENE");
            }
        }
    }
}
`
  },
  {
    languageSlug: 'java',
    levelNumber: 2,
    title: 'Electricity Bill Calculator',
    statement: 'Calculate the total electricity bill for U units consumed. Rates: First 100 units cost 5 per unit; any remaining units above 100 cost 8 per unit. Print the total bill.',
    input_format: 'A single integer U.',
    output_format: 'Print the total electricity bill.',
    constraints_text: '0 <= U <= 10000',
    explanation: 'For 150 units: 100 * 5 + 50 * 8 = 500 + 400 = 900.',
    samples: [
      { sample_input: '150\n', expected_output: '900\n', explanation: '100*5 + 50*8 = 900' },
      { sample_input: '80\n', expected_output: '400\n', explanation: '80*5 = 400' }
    ],
    test_cases: [
      { test_input: '150\n', expected_output: '900\n', is_hidden: false },
      { test_input: '80\n', expected_output: '400\n', is_hidden: false },
      { test_input: '100\n', expected_output: '500\n', is_hidden: true },
      { test_input: '0\n', expected_output: '0\n', is_hidden: true },
      { test_input: '200\n', expected_output: '1300\n', is_hidden: true }
    ],
    starter_code: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNextLong()) {
            long u = sc.nextLong();
            long bill = 0;
            if (u <= 100) {
                bill = u * 5;
            } else {
                bill = 100 * 5 + (u - 100) * 8;
            }
            System.out.println(bill);
        }
    }
}
`
  },

  // =========================================================================
  // LEVEL 3: Looping & Numbers
  // =========================================================================
  {
    languageSlug: 'java',
    levelNumber: 3,
    title: 'Sum of Odd Numbers in Range',
    statement: 'Given two integers L and R (L <= R), compute and print the sum of all odd integers between L and R inclusive.',
    input_format: 'Two space-separated integers L and R.',
    output_format: 'Print the sum of odd numbers.',
    constraints_text: '1 <= L <= R <= 10^5',
    explanation: 'Between 1 and 6, odd numbers are 1, 3, 5. Sum is 9.',
    samples: [
      { sample_input: '1 6\n', expected_output: '9\n', explanation: '1 + 3 + 5 = 9' }
    ],
    test_cases: [
      { test_input: '1 6\n', expected_output: '9\n', is_hidden: false },
      { test_input: '2 8\n', expected_output: '15\n', is_hidden: true },
      { test_input: '5 5\n', expected_output: '5\n', is_hidden: true },
      { test_input: '4 4\n', expected_output: '0\n', is_hidden: true }
    ],
    starter_code: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNextLong()) {
            long l = sc.nextLong();
            long r = sc.nextLong();
            long sum = 0;
            for (long i = l; i <= r; i++) {
                if (i % 2 != 0) sum += i;
            }
            System.out.println(sum);
        }
    }
}
`
  },
  {
    languageSlug: 'java',
    levelNumber: 3,
    title: 'Count Occurrences of a Digit',
    statement: 'Given an integer N and a digit D (0 <= D <= 9), count how many times digit D appears in the decimal representation of N.',
    input_format: 'Two space-separated integers N and D.',
    output_format: 'Print the count of digit occurrences.',
    constraints_text: '0 <= N <= 10^12, 0 <= D <= 9',
    explanation: 'In 12232, digit 2 appears 3 times.',
    samples: [
      { sample_input: '12232 2\n', expected_output: '3\n', explanation: 'Digit 2 appears 3 times' },
      { sample_input: '0 0\n', expected_output: '1\n', explanation: '0 has one 0' }
    ],
    test_cases: [
      { test_input: '12232 2\n', expected_output: '3\n', is_hidden: false },
      { test_input: '0 0\n', expected_output: '1\n', is_hidden: false },
      { test_input: '54321 9\n', expected_output: '0\n', is_hidden: true },
      { test_input: '777777 7\n', expected_output: '6\n', is_hidden: true }
    ],
    starter_code: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNext()) {
            String nStr = sc.next();
            char dChar = sc.next().charAt(0);
            int count = 0;
            for (char c : nStr.toCharArray()) {
                if (c == dChar) count++;
            }
            System.out.println(count);
        }
    }
}
`
  },
  {
    languageSlug: 'java',
    levelNumber: 3,
    title: 'Print Line of Asterisks',
    statement: 'Given an integer N, print a line containing N asterisks (*) without spaces between them.',
    input_format: 'A single integer N.',
    output_format: 'Print a string of N asterisks.',
    constraints_text: '1 <= N <= 100',
    explanation: 'For N = 5, output is "*****".',
    samples: [
      { sample_input: '5\n', expected_output: '*****\n', explanation: '5 asterisks' }
    ],
    test_cases: [
      { test_input: '5\n', expected_output: '*****\n', is_hidden: false },
      { test_input: '1\n', expected_output: '*\n', is_hidden: true },
      { test_input: '10\n', expected_output: '**********\n', is_hidden: true }
    ],
    starter_code: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNextInt()) {
            int n = sc.nextInt();
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < n; i++) sb.append('*');
            System.out.println(sb.toString());
        }
    }
}
`
  },
  {
    languageSlug: 'java',
    levelNumber: 3,
    title: 'Harmonic Number Floor',
    statement: 'The N-th harmonic number is H(N) = 1/1 + 1/2 + 1/3 + ... + 1/N. Given integer N, compute H(N) using double precision and print floor(H(N)) as an integer.',
    input_format: 'A single integer N.',
    output_format: 'Print floor(H(N)) as an integer.',
    constraints_text: '1 <= N <= 10^5',
    explanation: 'For N = 4: 1 + 0.5 + 0.333 + 0.25 = 2.0833, floor is 2.',
    samples: [
      { sample_input: '4\n', expected_output: '2\n', explanation: 'floor(2.0833) = 2' },
      { sample_input: '1\n', expected_output: '1\n', explanation: 'H(1) = 1' }
    ],
    test_cases: [
      { test_input: '4\n', expected_output: '2\n', is_hidden: false },
      { test_input: '1\n', expected_output: '1\n', is_hidden: false },
      { test_input: '10\n', expected_output: '2\n', is_hidden: true },
      { test_input: '100\n', expected_output: '5\n', is_hidden: true }
    ],
    starter_code: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNextInt()) {
            int n = sc.nextInt();
            double h = 0.0;
            for (int i = 1; i <= n; i++) {
                h += 1.0 / i;
            }
            System.out.println((long)Math.floor(h));
        }
    }
}
`
  },
  {
    languageSlug: 'java',
    levelNumber: 3,
    title: 'Check Power of Two',
    statement: 'Given a positive integer N, determine if it is a power of 2 (e.g., 1, 2, 4, 8, 16, ...). Print "YES" or "NO".',
    input_format: 'A single integer N.',
    output_format: 'Print "YES" or "NO".',
    constraints_text: '1 <= N <= 10^18',
    explanation: '16 is 2^4 so YES. 18 is not a power of 2 so NO.',
    samples: [
      { sample_input: '16\n', expected_output: 'YES\n', explanation: '2^4 = 16' },
      { sample_input: '18\n', expected_output: 'NO\n', explanation: 'Not a power of 2' }
    ],
    test_cases: [
      { test_input: '16\n', expected_output: 'YES\n', is_hidden: false },
      { test_input: '18\n', expected_output: 'NO\n', is_hidden: false },
      { test_input: '1\n', expected_output: 'YES\n', is_hidden: true },
      { test_input: '1024\n', expected_output: 'YES\n', is_hidden: true },
      { test_input: '1000\n', expected_output: 'NO\n', is_hidden: true }
    ],
    starter_code: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNextLong()) {
            long n = sc.nextLong();
            if (n > 0 && (n & (n - 1)) == 0) {
                System.out.println("YES");
            } else {
                System.out.println("NO");
            }
        }
    }
}
`
  },

  // =========================================================================
  // LEVEL 4: Arrays & Strings
  // =========================================================================
  {
    languageSlug: 'java',
    levelNumber: 4,
    title: 'Second Largest in Array',
    statement: 'Given N distinct integers (N >= 2), find and print the second largest element.',
    input_format: 'First line contains N. Second line contains N space-separated integers.',
    output_format: 'Print the second largest integer.',
    constraints_text: '2 <= N <= 1000, -10^5 <= A[i] <= 10^5',
    explanation: 'In [10, 40, 20, 50], largest is 50, second largest is 40.',
    samples: [
      { sample_input: '4\n10 40 20 50\n', expected_output: '40\n', explanation: 'Second largest is 40' }
    ],
    test_cases: [
      { test_input: '4\n10 40 20 50\n', expected_output: '40\n', is_hidden: false },
      { test_input: '2\n5 12\n', expected_output: '5\n', is_hidden: true },
      { test_input: '5\n-10 -20 -5 -30 -15\n', expected_output: '-10\n', is_hidden: true }
    ],
    starter_code: `import java.util.Scanner;
import java.util.Arrays;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNextInt()) {
            int n = sc.nextInt();
            long[] arr = new long[n];
            for (int i = 0; i < n; i++) arr[i] = sc.nextLong();
            Arrays.sort(arr);
            System.out.println(arr[n - 2]);
        }
    }
}
`
  },
  {
    languageSlug: 'java',
    levelNumber: 4,
    title: 'Count Words in Sentence',
    statement: 'Given a line of text containing words separated by single spaces, count and print the total number of words.',
    input_format: 'A single line containing space-separated words.',
    output_format: 'Print the word count.',
    constraints_text: '1 <= words <= 1000',
    explanation: '"Java is a popular language" contains 5 words.',
    samples: [
      { sample_input: 'Java is a popular language\n', expected_output: '5\n', explanation: '5 words' }
    ],
    test_cases: [
      { test_input: 'Java is a popular language\n', expected_output: '5\n', is_hidden: false },
      { test_input: 'Hello\n', expected_output: '1\n', is_hidden: true },
      { test_input: 'One Two Three Four\n', expected_output: '4\n', is_hidden: true }
    ],
    starter_code: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int count = 0;
        while (sc.hasNext()) {
            sc.next();
            count++;
        }
        System.out.println(count);
    }
}
`
  },
  {
    languageSlug: 'java',
    levelNumber: 4,
    title: 'Rotate Array Left by One',
    statement: 'Given an array of N integers, shift all elements left by 1 position (the first element moves to the end of the array). Print the rotated array space-separated.',
    input_format: 'First line contains N. Second line contains N integers.',
    output_format: 'Print the rotated array.',
    constraints_text: '1 <= N <= 1000',
    explanation: '[1, 2, 3, 4, 5] rotated left becomes 2 3 4 5 1.',
    samples: [
      { sample_input: '5\n1 2 3 4 5\n', expected_output: '2 3 4 5 1\n', explanation: 'Shifted left by one' }
    ],
    test_cases: [
      { test_input: '5\n1 2 3 4 5\n', expected_output: '2 3 4 5 1\n', is_hidden: false },
      { test_input: '1\n99\n', expected_output: '99\n', is_hidden: true },
      { test_input: '2\n10 20\n', expected_output: '20 10\n', is_hidden: true }
    ],
    starter_code: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNextInt()) {
            int n = sc.nextInt();
            int[] arr = new int[n];
            for (int i = 0; i < n; i++) arr[i] = sc.nextInt();
            if (n == 1) {
                System.out.println(arr[0]);
                return;
            }
            StringBuilder sb = new StringBuilder();
            for (int i = 1; i < n; i++) sb.append(arr[i]).append(' ');
            sb.append(arr[0]);
            System.out.println(sb.toString());
        }
    }
}
`
  },
  {
    languageSlug: 'java',
    levelNumber: 4,
    title: 'Reverse String with StringBuilder',
    statement: 'Given a single word string, reverse it using StringBuilder and print the reversed string.',
    input_format: 'A single word string.',
    output_format: 'Print the reversed word.',
    constraints_text: '1 <= length <= 100',
    explanation: '"practice" reversed is "ecitcarp".',
    samples: [
      { sample_input: 'practice\n', expected_output: 'ecitcarp\n', explanation: 'Reversed string' }
    ],
    test_cases: [
      { test_input: 'practice\n', expected_output: 'ecitcarp\n', is_hidden: false },
      { test_input: 'level\n', expected_output: 'level\n', is_hidden: true },
      { test_input: 'a\n', expected_output: 'a\n', is_hidden: true }
    ],
    starter_code: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNext()) {
            String word = sc.next();
            System.out.println(new StringBuilder(word).reverse().toString());
        }
    }
}
`
  },
  {
    languageSlug: 'java',
    levelNumber: 4,
    title: 'Check Anagram Strings',
    statement: 'Given two lowercase words S1 and S2, check if they are anagrams (contain the same characters with identical frequencies). Print "YES" or "NO".',
    input_format: 'Two space-separated words.',
    output_format: 'Print "YES" or "NO".',
    constraints_text: '1 <= length <= 100',
    explanation: '"listen" and "silent" are anagrams, so YES. "hello" and "world" are not.',
    samples: [
      { sample_input: 'listen silent\n', expected_output: 'YES\n', explanation: 'Same letters' },
      { sample_input: 'hello world\n', expected_output: 'NO\n', explanation: 'Different letters' }
    ],
    test_cases: [
      { test_input: 'listen silent\n', expected_output: 'YES\n', is_hidden: false },
      { test_input: 'hello world\n', expected_output: 'NO\n', is_hidden: false },
      { test_input: 'rat tar\n', expected_output: 'YES\n', is_hidden: true },
      { test_input: 'abc abcd\n', expected_output: 'NO\n', is_hidden: true }
    ],
    starter_code: `import java.util.Scanner;
import java.util.Arrays;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNext()) {
            String s1 = sc.next();
            String s2 = sc.next();
            if (s1.length() != s2.length()) {
                System.out.println("NO");
                return;
            }
            char[] a1 = s1.toCharArray();
            char[] a2 = s2.toCharArray();
            Arrays.sort(a1);
            Arrays.sort(a2);
            if (Arrays.equals(a1, a2)) System.out.println("YES");
            else System.out.println("NO");
        }
    }
}
`
  },

  // =========================================================================
  // LEVEL 5: Methods & Recursion
  // =========================================================================
  {
    languageSlug: 'java',
    levelNumber: 5,
    title: 'Recursive Sum of Array',
    statement: 'Write a recursive method sumArray(int[] arr, int index) to calculate the sum of elements from index 0 to N-1.',
    input_format: 'First line contains N. Second line contains N integers.',
    output_format: 'Print the array sum.',
    constraints_text: '1 <= N <= 1000',
    explanation: 'Sum of [5, 10, 15] is 30.',
    samples: [
      { sample_input: '3\n5 10 15\n', expected_output: '30\n', explanation: '5+10+15 = 30' }
    ],
    test_cases: [
      { test_input: '3\n5 10 15\n', expected_output: '30\n', is_hidden: false },
      { test_input: '1\n100\n', expected_output: '100\n', is_hidden: true },
      { test_input: '4\n-5 5 -10 10\n', expected_output: '0\n', is_hidden: true }
    ],
    starter_code: `import java.util.Scanner;

public class Main {
    public static long sumArray(long[] arr, int idx) {
        if (idx == arr.length) return 0;
        return arr[idx] + sumArray(arr, idx + 1);
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNextInt()) {
            int n = sc.nextInt();
            long[] arr = new long[n];
            for (int i = 0; i < n; i++) arr[i] = sc.nextLong();
            System.out.println(sumArray(arr, 0));
        }
    }
}
`
  },
  {
    languageSlug: 'java',
    levelNumber: 5,
    title: 'Collatz Sequence Step Counter',
    statement: 'Given a positive integer N, count the number of steps to reach 1 following the rules: if N is even, N = N / 2; if N is odd, N = 3 * N + 1.',
    input_format: 'A single integer N.',
    output_format: 'Print the count of transformation steps.',
    constraints_text: '1 <= N <= 10^6',
    explanation: '6 -> 3 -> 10 -> 5 -> 16 -> 8 -> 4 -> 2 -> 1 takes 8 steps.',
    samples: [
      { sample_input: '6\n', expected_output: '8\n', explanation: 'Takes 8 steps to reach 1' },
      { sample_input: '1\n', expected_output: '0\n', explanation: 'Already at 1' }
    ],
    test_cases: [
      { test_input: '6\n', expected_output: '8\n', is_hidden: false },
      { test_input: '1\n', expected_output: '0\n', is_hidden: false },
      { test_input: '2\n', expected_output: '1\n', is_hidden: true },
      { test_input: '10\n', expected_output: '6\n', is_hidden: true }
    ],
    starter_code: `import java.util.Scanner;

public class Main {
    public static int collatzSteps(long n) {
        int steps = 0;
        while (n != 1) {
            if (n % 2 == 0) n /= 2;
            else n = 3 * n + 1;
            steps++;
        }
        return steps;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNextLong()) {
            long n = sc.nextLong();
            System.out.println(collatzSteps(n));
        }
    }
}
`
  },
  {
    languageSlug: 'java',
    levelNumber: 5,
    title: 'Recursive Palindrome Check',
    statement: 'Implement a recursive method isPalindrome(String s, int left, int right) to check if a word is a palindrome. Print "TRUE" or "FALSE".',
    input_format: 'A single word string.',
    output_format: 'Print "TRUE" or "FALSE".',
    constraints_text: '1 <= length <= 100',
    explanation: '"madam" is palindrome -> TRUE. "java" is not -> FALSE.',
    samples: [
      { sample_input: 'madam\n', expected_output: 'TRUE\n', explanation: 'Reads identically forwards and backwards' },
      { sample_input: 'java\n', expected_output: 'FALSE\n', explanation: 'Not a palindrome' }
    ],
    test_cases: [
      { test_input: 'madam\n', expected_output: 'TRUE\n', is_hidden: false },
      { test_input: 'java\n', expected_output: 'FALSE\n', is_hidden: false },
      { test_input: 'racecar\n', expected_output: 'TRUE\n', is_hidden: true },
      { test_input: 'x\n', expected_output: 'TRUE\n', is_hidden: true }
    ],
    starter_code: `import java.util.Scanner;

public class Main {
    public static boolean isPal(String s, int l, int r) {
        if (l >= r) return true;
        if (s.charAt(l) != s.charAt(r)) return false;
        return isPal(s, l + 1, r - 1);
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNext()) {
            String s = sc.next();
            System.out.println(isPal(s, 0, s.length() - 1) ? "TRUE" : "FALSE");
        }
    }
}
`
  },
  {
    languageSlug: 'java',
    levelNumber: 5,
    title: 'Least Common Multiple (LCM)',
    statement: 'Write a method to compute the Least Common Multiple (LCM) of two positive integers A and B using the formula LCM(A, B) = (A * B) / GCD(A, B).',
    input_format: 'Two space-separated integers A and B.',
    output_format: 'Print LCM(A, B).',
    constraints_text: '1 <= A, B <= 10^7',
    explanation: 'LCM(12, 18) = 36.',
    samples: [
      { sample_input: '12 18\n', expected_output: '36\n', explanation: 'LCM of 12 and 18 is 36' }
    ],
    test_cases: [
      { test_input: '12 18\n', expected_output: '36\n', is_hidden: false },
      { test_input: '5 7\n', expected_output: '35\n', is_hidden: true },
      { test_input: '10 10\n', expected_output: '10\n', is_hidden: true }
    ],
    starter_code: `import java.util.Scanner;

public class Main {
    public static long gcd(long a, long b) {
        while (b != 0) {
            long t = b;
            b = a % b;
            a = t;
        }
        return a;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNextLong()) {
            long a = sc.nextLong();
            long b = sc.nextLong();
            long lcm = (a / gcd(a, b)) * b;
            System.out.println(lcm);
        }
    }
}
`
  },
  {
    languageSlug: 'java',
    levelNumber: 5,
    title: 'Binary Search Index Lookup',
    statement: 'Implement binary search on a sorted array of N integers to locate target K. Print the 0-based index of K, or -1 if not found.',
    input_format: 'First line contains N. Second line contains N sorted integers. Third line contains K.',
    output_format: 'Print the 0-based index or -1.',
    constraints_text: '1 <= N <= 10^5, -10^9 <= A[i], K <= 10^9',
    explanation: 'In [2, 5, 8, 12, 16], target 12 is at index 3.',
    samples: [
      { sample_input: '5\n2 5 8 12 16\n12\n', expected_output: '3\n', explanation: 'Index 3' }
    ],
    test_cases: [
      { test_input: '5\n2 5 8 12 16\n12\n', expected_output: '3\n', is_hidden: false },
      { test_input: '4\n1 3 5 7\n4\n', expected_output: '-1\n', is_hidden: true },
      { test_input: '1\n42\n42\n', expected_output: '0\n', is_hidden: true }
    ],
    starter_code: `import java.util.Scanner;

public class Main {
    public static int binarySearch(long[] arr, long target) {
        int low = 0, high = arr.length - 1;
        while (low <= high) {
            int mid = low + (high - low) / 2;
            if (arr[mid] == target) return mid;
            else if (arr[mid] < target) low = mid + 1;
            else high = mid - 1;
        }
        return -1;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNextInt()) {
            int n = sc.nextInt();
            long[] arr = new long[n];
            for (int i = 0; i < n; i++) arr[i] = sc.nextLong();
            long k = sc.nextLong();
            System.out.println(binarySearch(arr, k));
        }
    }
}
`
  },

  // =========================================================================
  // LEVEL 6: Classes & Collections
  // =========================================================================
  {
    languageSlug: 'java',
    levelNumber: 6,
    title: 'Bank Account Balance Manager',
    statement: 'Create a BankAccount class with deposit and withdraw methods. Starting from an initial balance B, process N transactions (positive = deposit, negative = withdrawal). Print the final balance.',
    input_format: 'First line contains initial balance B. Second line contains N. Third line contains N integers.',
    output_format: 'Print the final balance.',
    constraints_text: '0 <= B <= 10^9, 1 <= N <= 1000',
    explanation: 'Start with 1000. Transactions: +200, -150 -> 1050.',
    samples: [
      { sample_input: '1000\n2\n200 -150\n', expected_output: '1050\n', explanation: '1000 + 200 - 150 = 1050' }
    ],
    test_cases: [
      { test_input: '1000\n2\n200 -150\n', expected_output: '1050\n', is_hidden: false },
      { test_input: '500\n3\n100 200 -300\n', expected_output: '500\n', is_hidden: true },
      { test_input: '0\n1\n100\n', expected_output: '100\n', is_hidden: true }
    ],
    starter_code: `import java.util.Scanner;

class BankAccount {
    private long balance;
    public BankAccount(long init) { this.balance = init; }
    public void transact(long amount) { this.balance += amount; }
    public long getBalance() { return this.balance; }
}

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNextLong()) {
            long init = sc.nextLong();
            int n = sc.nextInt();
            BankAccount acc = new BankAccount(init);
            for (int i = 0; i < n; i++) acc.transact(sc.nextLong());
            System.out.println(acc.getBalance());
        }
    }
}
`
  },
  {
    languageSlug: 'java',
    levelNumber: 6,
    title: 'Student Grade Tracker',
    statement: 'Given N test scores (N >= 1), compute the integer average (sum / N) and the maximum score. Print them separated by a space.',
    input_format: 'First line contains N. Second line contains N integers.',
    output_format: 'Print "<average> <max>".',
    constraints_text: '1 <= N <= 1000, 0 <= scores <= 100',
    explanation: 'For scores 80, 90, 70: average is 80, max is 90.',
    samples: [
      { sample_input: '3\n80 90 70\n', expected_output: '80 90\n', explanation: 'Avg: 80, Max: 90' }
    ],
    test_cases: [
      { test_input: '3\n80 90 70\n', expected_output: '80 90\n', is_hidden: false },
      { test_input: '1\n100\n', expected_output: '100 100\n', is_hidden: true },
      { test_input: '4\n50 50 50 50\n', expected_output: '50 50\n', is_hidden: true }
    ],
    starter_code: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNextInt()) {
            int n = sc.nextInt();
            long sum = 0;
            int max = -1;
            for (int i = 0; i < n; i++) {
                int s = sc.nextInt();
                sum += s;
                if (s > max) max = s;
            }
            System.out.println((sum / n) + " " + max);
        }
    }
}
`
  },
  {
    languageSlug: 'java',
    levelNumber: 6,
    title: 'Unique Words Alphabetical using TreeSet',
    statement: 'Given N words, insert them into a TreeSet to eliminate duplicates and sort them. Print the unique words separated by spaces on one line.',
    input_format: 'First line contains N. Second line contains N space-separated words.',
    output_format: 'Print sorted unique words space-separated.',
    constraints_text: '1 <= N <= 1000',
    explanation: 'In "pear apple orange apple", unique sorted words are "apple orange pear".',
    samples: [
      { sample_input: '4\npear apple orange apple\n', expected_output: 'apple orange pear\n', explanation: 'Sorted unique words' }
    ],
    test_cases: [
      { test_input: '4\npear apple orange apple\n', expected_output: 'apple orange pear\n', is_hidden: false },
      { test_input: '3\nc b a\n', expected_output: 'a b c\n', is_hidden: true },
      { test_input: '2\nsame same\n', expected_output: 'same\n', is_hidden: true }
    ],
    starter_code: `import java.util.Scanner;
import java.util.TreeSet;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNextInt()) {
            int n = sc.nextInt();
            TreeSet<String> set = new TreeSet<>();
            for (int i = 0; i < n; i++) set.add(sc.next());
            StringBuilder sb = new StringBuilder();
            for (String s : set) {
                if (sb.length() > 0) sb.append(' ');
                sb.append(s);
            }
            System.out.println(sb.toString());
        }
    }
}
`
  },
  {
    languageSlug: 'java',
    levelNumber: 6,
    title: 'Key-Value Inventory Lookup using HashMap',
    statement: 'Read N item-price pairs into a HashMap. Then read a query item name and print its price, or "NOT FOUND" if not in the inventory.',
    input_format: 'First line contains N. The next N lines contain an item string and integer price. The last line contains the query item.',
    output_format: 'Print the price or "NOT FOUND".',
    constraints_text: '1 <= N <= 1000',
    explanation: 'Querying "laptop" in inventory gives 1200.',
    samples: [
      { sample_input: '2\nphone 600\nlaptop 1200\nlaptop\n', expected_output: '1200\n', explanation: 'Price of laptop is 1200' }
    ],
    test_cases: [
      { test_input: '2\nphone 600\nlaptop 1200\nlaptop\n', expected_output: '1200\n', is_hidden: false },
      { test_input: '1\nbook 20\npen\n', expected_output: 'NOT FOUND\n', is_hidden: true },
      { test_input: '2\napple 3\nbanana 2\napple\n', expected_output: '3\n', is_hidden: true }
    ],
    starter_code: `import java.util.Scanner;
import java.util.HashMap;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNextInt()) {
            int n = sc.nextInt();
            HashMap<String, Integer> map = new HashMap<>();
            for (int i = 0; i < n; i++) {
                String item = sc.next();
                int price = sc.nextInt();
                map.put(item, price);
            }
            String query = sc.next();
            if (map.containsKey(query)) {
                System.out.println(map.get(query));
            } else {
                System.out.println("NOT FOUND");
            }
        }
    }
}
`
  },
  {
    languageSlug: 'java',
    levelNumber: 6,
    title: 'Find Most Frequent Element',
    statement: 'Given N integers, use a HashMap to find the element with the highest frequency. If there is a tie, print the numerically smaller element.',
    input_format: 'First line contains N. Second line contains N integers.',
    output_format: 'Print the most frequent integer.',
    constraints_text: '1 <= N <= 1000, -10^5 <= A[i] <= 10^5',
    explanation: 'In [4, 2, 4, 2, 2, 5], 2 appears 3 times, which is the highest.',
    samples: [
      { sample_input: '6\n4 2 4 2 2 5\n', expected_output: '2\n', explanation: '2 appears 3 times' }
    ],
    test_cases: [
      { test_input: '6\n4 2 4 2 2 5\n', expected_output: '2\n', is_hidden: false },
      { test_input: '4\n1 2 2 1\n', expected_output: '1\n', is_hidden: true },
      { test_input: '1\n99\n', expected_output: '99\n', is_hidden: true }
    ],
    starter_code: `import java.util.Scanner;
import java.util.HashMap;
import java.util.Map;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNextInt()) {
            int n = sc.nextInt();
            HashMap<Long, Integer> freq = new HashMap<>();
            for (int i = 0; i < n; i++) {
                long x = sc.nextLong();
                freq.put(x, freq.getOrDefault(x, 0) + 1);
            }
            long bestVal = 0;
            int maxCount = -1;
            for (Map.Entry<Long, Integer> e : freq.entrySet()) {
                long val = e.getKey();
                int count = e.getValue();
                if (count > maxCount || (count == maxCount && val < bestVal)) {
                    maxCount = count;
                    bestVal = val;
                }
            }
            System.out.println(bestVal);
        }
    }
}
`
  }
];

module.exports = javaQuestions;
