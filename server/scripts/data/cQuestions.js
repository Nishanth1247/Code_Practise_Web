/**
 * Seed questions for C track (6 levels x 5 questions = 30 questions)
 * Curriculum:
 * Level 1: Fundamentals & I/O
 * Level 2: Control Flow & Conditions
 * Level 3: Loops & Iterations
 * Level 4: Arrays & Strings
 * Level 5: Functions & Recursion
 * Level 6: Pointers & Structures
 */

const cQuestions = [
  // =========================================================================
  // LEVEL 1: Fundamentals & I/O
  // =========================================================================
  {
    languageSlug: 'c',
    levelNumber: 1,
    title: 'Sum of Two Integers',
    statement: 'Given two integers A and B from standard input, compute and print their sum to standard output.',
    input_format: 'A single line containing two space-separated integers A and B.',
    output_format: 'Print the sum A + B on a single line.',
    constraints_text: '-10000 <= A, B <= 10000',
    explanation: 'For input 5 and 7, 5 + 7 = 12.',
    samples: [
      { sample_input: '5 7\n', expected_output: '12\n', explanation: '5 + 7 = 12' },
      { sample_input: '-3 8\n', expected_output: '5\n', explanation: '-3 + 8 = 5' }
    ],
    test_cases: [
      { test_input: '5 7\n', expected_output: '12\n', is_hidden: false },
      { test_input: '0 0\n', expected_output: '0\n', is_hidden: true },
      { test_input: '-10 -25\n', expected_output: '-35\n', is_hidden: true },
      { test_input: '9999 1\n', expected_output: '10000\n', is_hidden: true }
    ],
    starter_code: `#include <stdio.h>

int main() {
    int a, b;
    if (scanf("%d %d", &a, &b) == 2) {
        printf("%d\\n", a + b);
    }
    return 0;
}
`
  },
  {
    languageSlug: 'c',
    levelNumber: 1,
    title: 'Area and Perimeter of a Rectangle',
    statement: 'Write a program that takes the length and width of a rectangle and prints its Area and Perimeter separated by a space.',
    input_format: 'Two integers L and W separated by a space representing length and width.',
    output_format: 'Print two space-separated integers: Area and Perimeter.',
    constraints_text: '1 <= L, W <= 1000',
    explanation: 'Area = L * W, Perimeter = 2 * (L + W).',
    samples: [
      { sample_input: '5 4\n', expected_output: '20 18\n', explanation: 'Area = 20, Perimeter = 18' }
    ],
    test_cases: [
      { test_input: '5 4\n', expected_output: '20 18\n', is_hidden: false },
      { test_input: '10 10\n', expected_output: '100 40\n', is_hidden: true },
      { test_input: '1 1\n', expected_output: '1 4\n', is_hidden: true },
      { test_input: '100 50\n', expected_output: '5000 300\n', is_hidden: true }
    ],
    starter_code: `#include <stdio.h>

int main() {
    int l, w;
    if (scanf("%d %d", &l, &w) == 2) {
        printf("%d %d\\n", l * w, 2 * (l + w));
    }
    return 0;
}
`
  },
  {
    languageSlug: 'c',
    levelNumber: 1,
    title: 'Celsius to Fahrenheit',
    statement: 'Given an integer temperature C in Celsius, convert it to Fahrenheit using integer arithmetic: F = (C * 9) / 5 + 32.',
    input_format: 'A single integer C representing temperature in Celsius.',
    output_format: 'Print the converted temperature in Fahrenheit as an integer.',
    constraints_text: '-100 <= C <= 200',
    explanation: 'For C = 0, (0 * 9)/5 + 32 = 32. For C = 100, (100 * 9)/5 + 32 = 212.',
    samples: [
      { sample_input: '0\n', expected_output: '32\n', explanation: '(0 * 9)/5 + 32 = 32' },
      { sample_input: '100\n', expected_output: '212\n', explanation: '(100 * 9)/5 + 32 = 212' }
    ],
    test_cases: [
      { test_input: '0\n', expected_output: '32\n', is_hidden: false },
      { test_input: '100\n', expected_output: '212\n', is_hidden: false },
      { test_input: '25\n', expected_output: '77\n', is_hidden: true },
      { test_input: '-40\n', expected_output: '-40\n', is_hidden: true },
      { test_input: '37\n', expected_output: '98\n', is_hidden: true }
    ],
    starter_code: `#include <stdio.h>

int main() {
    int c;
    if (scanf("%d", &c) == 1) {
        int f = (c * 9) / 5 + 32;
        printf("%d\\n", f);
    }
    return 0;
}
`
  },
  {
    languageSlug: 'c',
    levelNumber: 1,
    title: 'Swap Two Numbers',
    statement: 'Given two integers A and B, swap their values and print the swapped values separated by a space.',
    input_format: 'A single line containing two space-separated integers A and B.',
    output_format: 'Print the swapped integers B and A separated by a space.',
    constraints_text: '-10000 <= A, B <= 10000',
    explanation: 'If input is 10 20, after swapping the output is 20 10.',
    samples: [
      { sample_input: '10 20\n', expected_output: '20 10\n', explanation: 'Swapped: 20 10' }
    ],
    test_cases: [
      { test_input: '10 20\n', expected_output: '20 10\n', is_hidden: false },
      { test_input: '5 5\n', expected_output: '5 5\n', is_hidden: true },
      { test_input: '-100 50\n', expected_output: '50 -100\n', is_hidden: true },
      { test_input: '0 42\n', expected_output: '42 0\n', is_hidden: true }
    ],
    starter_code: `#include <stdio.h>

int main() {
    int a, b;
    if (scanf("%d %d", &a, &b) == 2) {
        int temp = a;
        a = b;
        b = temp;
        printf("%d %d\\n", a, b);
    }
    return 0;
}
`
  },
  {
    languageSlug: 'c',
    levelNumber: 1,
    title: 'Simple Interest Calculator',
    statement: 'Given principal P, rate of interest R, and time T (all integers), compute the simple interest using the formula: SI = (P * R * T) / 100 using integer division.',
    input_format: 'Three space-separated integers P, R, and T.',
    output_format: 'Print the computed simple interest as an integer.',
    constraints_text: '1 <= P <= 100000, 1 <= R <= 100, 1 <= T <= 50',
    explanation: 'For P=1000, R=5, T=2, SI = (1000 * 5 * 2) / 100 = 100.',
    samples: [
      { sample_input: '1000 5 2\n', expected_output: '100\n', explanation: '(1000 * 5 * 2) / 100 = 100' }
    ],
    test_cases: [
      { test_input: '1000 5 2\n', expected_output: '100\n', is_hidden: false },
      { test_input: '5000 10 3\n', expected_output: '1500\n', is_hidden: true },
      { test_input: '200 4 1\n', expected_output: '8\n', is_hidden: true },
      { test_input: '12500 8 5\n', expected_output: '5000\n', is_hidden: true }
    ],
    starter_code: `#include <stdio.h>

int main() {
    int p, r, t;
    if (scanf("%d %d %d", &p, &r, &t) == 3) {
        int si = (p * r * t) / 100;
        printf("%d\\n", si);
    }
    return 0;
}
`
  },

  // =========================================================================
  // LEVEL 2: Control Flow & Conditions
  // =========================================================================
  {
    languageSlug: 'c',
    levelNumber: 2,
    title: 'Check Even or Odd',
    statement: 'Given an integer N, print "EVEN" if the number is even, or "ODD" if the number is odd.',
    input_format: 'A single integer N.',
    output_format: 'Print "EVEN" or "ODD" in uppercase.',
    constraints_text: '-10^6 <= N <= 10^6',
    explanation: '4 is divisible by 2 so it is EVEN.',
    samples: [
      { sample_input: '4\n', expected_output: 'EVEN\n', explanation: '4 % 2 == 0' },
      { sample_input: '7\n', expected_output: 'ODD\n', explanation: '7 % 2 != 0' }
    ],
    test_cases: [
      { test_input: '4\n', expected_output: 'EVEN\n', is_hidden: false },
      { test_input: '0\n', expected_output: 'EVEN\n', is_hidden: true },
      { test_input: '-5\n', expected_output: 'ODD\n', is_hidden: true },
      { test_input: '1000000\n', expected_output: 'EVEN\n', is_hidden: true }
    ],
    starter_code: `#include <stdio.h>

int main() {
    int n;
    if (scanf("%d", &n) == 1) {
        if (n % 2 == 0) printf("EVEN\\n");
        else printf("ODD\\n");
    }
    return 0;
}
`
  },
  {
    languageSlug: 'c',
    levelNumber: 2,
    title: 'Maximum of Three Numbers',
    statement: 'Given three integers A, B, and C, determine and print the largest of the three values.',
    input_format: 'Three space-separated integers A, B, and C.',
    output_format: 'Print the largest integer on a single line.',
    constraints_text: '-10^5 <= A, B, C <= 10^5',
    explanation: 'Among 12, 45, and 23, 45 is the greatest.',
    samples: [
      { sample_input: '12 45 23\n', expected_output: '45\n', explanation: 'Max is 45' }
    ],
    test_cases: [
      { test_input: '12 45 23\n', expected_output: '45\n', is_hidden: false },
      { test_input: '100 10 5\n', expected_output: '100\n', is_hidden: true },
      { test_input: '-5 -2 -10\n', expected_output: '-2\n', is_hidden: true },
      { test_input: '7 7 7\n', expected_output: '7\n', is_hidden: true }
    ],
    starter_code: `#include <stdio.h>

int main() {
    int a, b, c;
    if (scanf("%d %d %d", &a, &b, &c) == 3) {
        int max = a;
        if (b > max) max = b;
        if (c > max) max = c;
        printf("%d\\n", max);
    }
    return 0;
}
`
  },
  {
    languageSlug: 'c',
    levelNumber: 2,
    title: 'Leap Year Checker',
    statement: 'Given a year Y, determine if it is a leap year. A year is a leap year if it is divisible by 4, except for century years which must also be divisible by 400. Print "LEAP" or "NOT LEAP".',
    input_format: 'A single integer Y representing the year.',
    output_format: 'Print "LEAP" or "NOT LEAP".',
    constraints_text: '1 <= Y <= 9999',
    explanation: '2000 is divisible by 400 so it is LEAP. 1900 is divisible by 100 but not 400, so NOT LEAP.',
    samples: [
      { sample_input: '2024\n', expected_output: 'LEAP\n', explanation: 'Divisible by 4 and not 100' },
      { sample_input: '1900\n', expected_output: 'NOT LEAP\n', explanation: 'Century year not divisible by 400' }
    ],
    test_cases: [
      { test_input: '2024\n', expected_output: 'LEAP\n', is_hidden: false },
      { test_input: '1900\n', expected_output: 'NOT LEAP\n', is_hidden: false },
      { test_input: '2000\n', expected_output: 'LEAP\n', is_hidden: true },
      { test_input: '2023\n', expected_output: 'NOT LEAP\n', is_hidden: true },
      { test_input: '2400\n', expected_output: 'LEAP\n', is_hidden: true }
    ],
    starter_code: `#include <stdio.h>

int main() {
    int y;
    if (scanf("%d", &y) == 1) {
        if ((y % 400 == 0) || (y % 4 == 0 && y % 100 != 0)) {
            printf("LEAP\\n");
        } else {
            printf("NOT LEAP\\n");
        }
    }
    return 0;
}
`
  },
  {
    languageSlug: 'c',
    levelNumber: 2,
    title: 'Letter Grade Calculator',
    statement: 'Given a student exam score S between 0 and 100, output the grade according to the scale: 90-100: A, 80-89: B, 70-79: C, 60-69: D, below 60: F.',
    input_format: 'A single integer S.',
    output_format: 'Print the single character grade (A, B, C, D, or F).',
    constraints_text: '0 <= S <= 100',
    explanation: 'For score 85, grade is B.',
    samples: [
      { sample_input: '85\n', expected_output: 'B\n', explanation: '85 falls in 80-89 range' },
      { sample_input: '55\n', expected_output: 'F\n', explanation: '55 is below 60' }
    ],
    test_cases: [
      { test_input: '85\n', expected_output: 'B\n', is_hidden: false },
      { test_input: '95\n', expected_output: 'A\n', is_hidden: true },
      { test_input: '70\n', expected_output: 'C\n', is_hidden: true },
      { test_input: '60\n', expected_output: 'D\n', is_hidden: true },
      { test_input: '0\n', expected_output: 'F\n', is_hidden: true }
    ],
    starter_code: `#include <stdio.h>

int main() {
    int s;
    if (scanf("%d", &s) == 1) {
        if (s >= 90) printf("A\\n");
        else if (s >= 80) printf("B\\n");
        else if (s >= 70) printf("C\\n");
        else if (s >= 60) printf("D\\n");
        else printf("F\\n");
    }
    return 0;
}
`
  },
  {
    languageSlug: 'c',
    levelNumber: 2,
    title: 'Triangle Validity by Angles',
    statement: 'Given three interior angles A, B, and C of a triangle in degrees, check if they form a valid triangle. A triangle is valid if all angles are strictly positive and their sum equals 180. Print "VALID" or "INVALID".',
    input_format: 'Three space-separated integers A, B, and C.',
    output_format: 'Print "VALID" or "INVALID".',
    constraints_text: '0 <= A, B, C <= 360',
    explanation: '60 + 60 + 60 = 180 and all > 0, so VALID.',
    samples: [
      { sample_input: '60 60 60\n', expected_output: 'VALID\n', explanation: 'Sum is 180' },
      { sample_input: '90 90 10\n', expected_output: 'INVALID\n', explanation: 'Sum is 190' }
    ],
    test_cases: [
      { test_input: '60 60 60\n', expected_output: 'VALID\n', is_hidden: false },
      { test_input: '90 45 45\n', expected_output: 'VALID\n', is_hidden: true },
      { test_input: '0 90 90\n', expected_output: 'INVALID\n', is_hidden: true },
      { test_input: '120 30 30\n', expected_output: 'VALID\n', is_hidden: true },
      { test_input: '50 50 50\n', expected_output: 'INVALID\n', is_hidden: true }
    ],
    starter_code: `#include <stdio.h>

int main() {
    int a, b, c;
    if (scanf("%d %d %d", &a, &b, &c) == 3) {
        if (a > 0 && b > 0 && c > 0 && (a + b + c == 180)) {
            printf("VALID\\n");
        } else {
            printf("INVALID\\n");
        }
    }
    return 0;
}
`
  },

  // =========================================================================
  // LEVEL 3: Loops & Iterations
  // =========================================================================
  {
    languageSlug: 'c',
    levelNumber: 3,
    title: 'Sum of First N Natural Numbers',
    statement: 'Given a positive integer N, compute the sum of the first N natural numbers (1 + 2 + ... + N) using a loop.',
    input_format: 'A single integer N.',
    output_format: 'Print the sum as a single integer.',
    constraints_text: '1 <= N <= 10000',
    explanation: 'For N = 5, 1 + 2 + 3 + 4 + 5 = 15.',
    samples: [
      { sample_input: '5\n', expected_output: '15\n', explanation: '1+2+3+4+5 = 15' }
    ],
    test_cases: [
      { test_input: '5\n', expected_output: '15\n', is_hidden: false },
      { test_input: '1\n', expected_output: '1\n', is_hidden: true },
      { test_input: '10\n', expected_output: '55\n', is_hidden: true },
      { test_input: '100\n', expected_output: '5050\n', is_hidden: true }
    ],
    starter_code: `#include <stdio.h>

int main() {
    int n;
    if (scanf("%d", &n) == 1) {
        long long sum = 0;
        for (int i = 1; i <= n; i++) {
            sum += i;
        }
        printf("%lld\\n", sum);
    }
    return 0;
}
`
  },
  {
    languageSlug: 'c',
    levelNumber: 3,
    title: 'Factorial of a Number',
    statement: 'Given an integer N between 0 and 12, calculate and print N factorial (N!). Note that 0! = 1.',
    input_format: 'A single integer N.',
    output_format: 'Print N! on a single line.',
    constraints_text: '0 <= N <= 12',
    explanation: '5! = 5 * 4 * 3 * 2 * 1 = 120.',
    samples: [
      { sample_input: '5\n', expected_output: '120\n', explanation: '5! = 120' },
      { sample_input: '0\n', expected_output: '1\n', explanation: '0! = 1' }
    ],
    test_cases: [
      { test_input: '5\n', expected_output: '120\n', is_hidden: false },
      { test_input: '0\n', expected_output: '1\n', is_hidden: false },
      { test_input: '1\n', expected_output: '1\n', is_hidden: true },
      { test_input: '7\n', expected_output: '5040\n', is_hidden: true },
      { test_input: '10\n', expected_output: '3628800\n', is_hidden: true }
    ],
    starter_code: `#include <stdio.h>

int main() {
    int n;
    if (scanf("%d", &n) == 1) {
        long long fact = 1;
        for (int i = 1; i <= n; i++) {
            fact *= i;
        }
        printf("%lld\\n", fact);
    }
    return 0;
}
`
  },
  {
    languageSlug: 'c',
    levelNumber: 3,
    title: 'Reverse an Integer',
    statement: 'Given an integer N, print its digits in reversed order. If N is negative, preserve the minus sign in front.',
    input_format: 'A single integer N.',
    output_format: 'Print the reversed integer.',
    constraints_text: '-10^9 <= N <= 10^9',
    explanation: 'For 1234, reversed is 4321. For -560, reversed is -65.',
    samples: [
      { sample_input: '1234\n', expected_output: '4321\n', explanation: '1234 reversed is 4321' },
      { sample_input: '-560\n', expected_output: '-65\n', explanation: '-560 reversed is -65' }
    ],
    test_cases: [
      { test_input: '1234\n', expected_output: '4321\n', is_hidden: false },
      { test_input: '-560\n', expected_output: '-65\n', is_hidden: false },
      { test_input: '0\n', expected_output: '0\n', is_hidden: true },
      { test_input: '1000\n', expected_output: '1\n', is_hidden: true },
      { test_input: '-7\n', expected_output: '-7\n', is_hidden: true }
    ],
    starter_code: `#include <stdio.h>

int main() {
    long long n;
    if (scanf("%lld", &n) == 1) {
        int isNeg = 0;
        if (n < 0) {
            isNeg = 1;
            n = -n;
        }
        long long rev = 0;
        while (n > 0) {
            rev = rev * 10 + (n % 10);
            n /= 10;
        }
        if (isNeg) rev = -rev;
        printf("%lld\\n", rev);
    }
    return 0;
}
`
  },
  {
    languageSlug: 'c',
    levelNumber: 3,
    title: 'Multiplication Table Line',
    statement: 'Given an integer N, print the first 10 multiples of N (N*1, N*2, ..., N*10) separated by single spaces on a single line.',
    input_format: 'A single integer N.',
    output_format: 'Print 10 space-separated integers.',
    constraints_text: '1 <= N <= 100',
    explanation: 'For N = 3, products are 3 6 9 12 15 18 21 24 27 30.',
    samples: [
      { sample_input: '3\n', expected_output: '3 6 9 12 15 18 21 24 27 30\n', explanation: 'Multiples of 3' }
    ],
    test_cases: [
      { test_input: '3\n', expected_output: '3 6 9 12 15 18 21 24 27 30\n', is_hidden: false },
      { test_input: '1\n', expected_output: '1 2 3 4 5 6 7 8 9 10\n', is_hidden: true },
      { test_input: '5\n', expected_output: '5 10 15 20 25 30 35 40 45 50\n', is_hidden: true },
      { test_input: '12\n', expected_output: '12 24 36 48 60 72 84 96 108 120\n', is_hidden: true }
    ],
    starter_code: `#include <stdio.h>

int main() {
    int n;
    if (scanf("%d", &n) == 1) {
        for (int i = 1; i <= 10; i++) {
            printf("%d%s", n * i, (i == 10) ? "\\n" : " ");
        }
    }
    return 0;
}
`
  },
  {
    languageSlug: 'c',
    levelNumber: 3,
    title: 'Count Number of Digits',
    statement: 'Given a non-negative integer N, count and print the total number of digits in N.',
    input_format: 'A single integer N.',
    output_format: 'Print the count of digits.',
    constraints_text: '0 <= N <= 10^9',
    explanation: 'For 54321, there are 5 digits. For 0, there is 1 digit.',
    samples: [
      { sample_input: '54321\n', expected_output: '5\n', explanation: '5 digits' },
      { sample_input: '0\n', expected_output: '1\n', explanation: '0 has 1 digit' }
    ],
    test_cases: [
      { test_input: '54321\n', expected_output: '5\n', is_hidden: false },
      { test_input: '0\n', expected_output: '1\n', is_hidden: false },
      { test_input: '9\n', expected_output: '1\n', is_hidden: true },
      { test_input: '1000000000\n', expected_output: '10\n', is_hidden: true },
      { test_input: '42\n', expected_output: '2\n', is_hidden: true }
    ],
    starter_code: `#include <stdio.h>

int main() {
    long long n;
    if (scanf("%lld", &n) == 1) {
        if (n == 0) {
            printf("1\\n");
            return 0;
        }
        int count = 0;
        while (n > 0) {
            count++;
            n /= 10;
        }
        printf("%d\\n", count);
    }
    return 0;
}
`
  },

  // =========================================================================
  // LEVEL 4: Arrays & Strings
  // =========================================================================
  {
    languageSlug: 'c',
    levelNumber: 4,
    title: 'Find Minimum and Maximum in Array',
    statement: 'Given an integer N followed by N integers, find and print the minimum and maximum values in the array separated by a space.',
    input_format: 'The first line contains integer N. The second line contains N space-separated integers.',
    output_format: 'Print the minimum and maximum integers separated by a single space.',
    constraints_text: '1 <= N <= 1000, -10^5 <= A[i] <= 10^5',
    explanation: 'For array [7, 2, 9, 4], min is 2 and max is 9.',
    samples: [
      { sample_input: '4\n7 2 9 4\n', expected_output: '2 9\n', explanation: 'Min: 2, Max: 9' }
    ],
    test_cases: [
      { test_input: '4\n7 2 9 4\n', expected_output: '2 9\n', is_hidden: false },
      { test_input: '1\n42\n', expected_output: '42 42\n', is_hidden: true },
      { test_input: '5\n-10 -50 0 25 100\n', expected_output: '-50 100\n', is_hidden: true },
      { test_input: '3\n5 5 5\n', expected_output: '5 5\n', is_hidden: true }
    ],
    starter_code: `#include <stdio.h>

int main() {
    int n;
    if (scanf("%d", &n) == 1 && n > 0) {
        int val;
        scanf("%d", &val);
        int min = val, max = val;
        for (int i = 1; i < n; i++) {
            scanf("%d", &val);
            if (val < min) min = val;
            if (val > max) max = val;
        }
        printf("%d %d\\n", min, max);
    }
    return 0;
}
`
  },
  {
    languageSlug: 'c',
    levelNumber: 4,
    title: 'Sum of Array Elements',
    statement: 'Given an integer N followed by N integers, compute and print the sum of all elements in the array.',
    input_format: 'First line contains integer N. Second line contains N space-separated integers.',
    output_format: 'Print the total sum on a single line.',
    constraints_text: '1 <= N <= 1000, -1000 <= A[i] <= 1000',
    explanation: 'For [1, 2, 3, 4, 5], sum is 15.',
    samples: [
      { sample_input: '5\n1 2 3 4 5\n', expected_output: '15\n', explanation: '1+2+3+4+5 = 15' }
    ],
    test_cases: [
      { test_input: '5\n1 2 3 4 5\n', expected_output: '15\n', is_hidden: false },
      { test_input: '3\n-5 10 -2\n', expected_output: '3\n', is_hidden: true },
      { test_input: '1\n99\n', expected_output: '99\n', is_hidden: true },
      { test_input: '4\n0 0 0 0\n', expected_output: '0\n', is_hidden: true }
    ],
    starter_code: `#include <stdio.h>

int main() {
    int n;
    if (scanf("%d", &n) == 1) {
        long long sum = 0;
        for (int i = 0; i < n; i++) {
            int val;
            scanf("%d", &val);
            sum += val;
        }
        printf("%lld\\n", sum);
    }
    return 0;
}
`
  },
  {
    languageSlug: 'c',
    levelNumber: 4,
    title: 'Count Vowels in String',
    statement: 'Given a single word consisting only of lowercase English letters, count and print the total number of vowels (a, e, i, o, u).',
    input_format: 'A single word on one line.',
    output_format: 'Print the count of vowels.',
    constraints_text: '1 <= length <= 100',
    explanation: 'In "algorithm", vowels are a, o, i (3 vowels).',
    samples: [
      { sample_input: 'algorithm\n', expected_output: '3\n', explanation: 'a, o, i' }
    ],
    test_cases: [
      { test_input: 'algorithm\n', expected_output: '3\n', is_hidden: false },
      { test_input: 'rhythm\n', expected_output: '0\n', is_hidden: true },
      { test_input: 'aeiou\n', expected_output: '5\n', is_hidden: true },
      { test_input: 'programming\n', expected_output: '3\n', is_hidden: true }
    ],
    starter_code: `#include <stdio.h>

int main() {
    char s[105];
    if (scanf("%100s", s) == 1) {
        int count = 0;
        for (int i = 0; s[i] != '\\0'; i++) {
            char c = s[i];
            if (c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u') {
                count++;
            }
        }
        printf("%d\\n", count);
    }
    return 0;
}
`
  },
  {
    languageSlug: 'c',
    levelNumber: 4,
    title: 'Check Palindrome String',
    statement: 'Given a single lowercase word, determine whether it reads the same backwards as forwards. Print "YES" if it is a palindrome, or "NO" otherwise.',
    input_format: 'A single lowercase word string.',
    output_format: 'Print "YES" or "NO".',
    constraints_text: '1 <= length <= 100',
    explanation: '"radar" reversed is "radar", so YES.',
    samples: [
      { sample_input: 'radar\n', expected_output: 'YES\n', explanation: 'Reads identically in reverse' },
      { sample_input: 'hello\n', expected_output: 'NO\n', explanation: 'hello != olleh' }
    ],
    test_cases: [
      { test_input: 'radar\n', expected_output: 'YES\n', is_hidden: false },
      { test_input: 'hello\n', expected_output: 'NO\n', is_hidden: false },
      { test_input: 'a\n', expected_output: 'YES\n', is_hidden: true },
      { test_input: 'noon\n', expected_output: 'YES\n', is_hidden: true },
      { test_input: 'coding\n', expected_output: 'NO\n', is_hidden: true }
    ],
    starter_code: `#include <stdio.h>
#include <string.h>

int main() {
    char s[105];
    if (scanf("%100s", s) == 1) {
        int len = strlen(s);
        int isPal = 1;
        for (int i = 0; i < len / 2; i++) {
            if (s[i] != s[len - 1 - i]) {
                isPal = 0;
                break;
            }
        }
        if (isPal) printf("YES\\n");
        else printf("NO\\n");
    }
    return 0;
}
`
  },
  {
    languageSlug: 'c',
    levelNumber: 4,
    title: 'Count Frequency of an Element',
    statement: 'Given an array of N integers and a target integer K, count how many times K appears in the array.',
    input_format: 'The first line contains N. The second line contains N space-separated integers. The third line contains integer K.',
    output_format: 'Print the count of occurrences of K.',
    constraints_text: '1 <= N <= 1000, -1000 <= A[i], K <= 1000',
    explanation: 'In [2, 5, 2, 8, 2], the number 2 appears 3 times.',
    samples: [
      { sample_input: '5\n2 5 2 8 2\n2\n', expected_output: '3\n', explanation: '2 appears 3 times' }
    ],
    test_cases: [
      { test_input: '5\n2 5 2 8 2\n2\n', expected_output: '3\n', is_hidden: false },
      { test_input: '4\n1 3 5 7\n4\n', expected_output: '0\n', is_hidden: true },
      { test_input: '1\n10\n10\n', expected_output: '1\n', is_hidden: true },
      { test_input: '6\n-1 -1 -1 0 1 -1\n-1\n', expected_output: '4\n', is_hidden: true }
    ],
    starter_code: `#include <stdio.h>

int main() {
    int n;
    if (scanf("%d", &n) == 1) {
        int arr[1005];
        for (int i = 0; i < n; i++) scanf("%d", &arr[i]);
        int k;
        scanf("%d", &k);
        int count = 0;
        for (int i = 0; i < n; i++) {
            if (arr[i] == k) count++;
        }
        printf("%d\\n", count);
    }
    return 0;
}
`
  },

  // =========================================================================
  // LEVEL 5: Functions & Recursion
  // =========================================================================
  {
    languageSlug: 'c',
    levelNumber: 5,
    title: 'Power Function',
    statement: 'Write a function to compute X raised to the power N (X^N) where N is non-negative.',
    input_format: 'Two space-separated integers X and N.',
    output_format: 'Print X^N on a single line.',
    constraints_text: '-10 <= X <= 10, 0 <= N <= 12',
    explanation: '2^5 = 32. 3^0 = 1.',
    samples: [
      { sample_input: '2 5\n', expected_output: '32\n', explanation: '2^5 = 32' },
      { sample_input: '3 0\n', expected_output: '1\n', explanation: 'Any non-zero number to power 0 is 1' }
    ],
    test_cases: [
      { test_input: '2 5\n', expected_output: '32\n', is_hidden: false },
      { test_input: '3 0\n', expected_output: '1\n', is_hidden: false },
      { test_input: '5 3\n', expected_output: '125\n', is_hidden: true },
      { test_input: '-2 4\n', expected_output: '16\n', is_hidden: true },
      { test_input: '-2 3\n', expected_output: '-8\n', is_hidden: true }
    ],
    starter_code: `#include <stdio.h>

long long power(int x, int n) {
    long long res = 1;
    for (int i = 0; i < n; i++) res *= x;
    return res;
}

int main() {
    int x, n;
    if (scanf("%d %d", &x, &n) == 2) {
        printf("%lld\\n", power(x, n));
    }
    return 0;
}
`
  },
  {
    languageSlug: 'c',
    levelNumber: 5,
    title: 'Greatest Common Divisor (GCD)',
    statement: 'Given two positive integers A and B, implement a function using Euclid\'s algorithm to compute their Greatest Common Divisor (GCD).',
    input_format: 'Two space-separated integers A and B.',
    output_format: 'Print the GCD.',
    constraints_text: '1 <= A, B <= 10^9',
    explanation: 'GCD of 24 and 36 is 12.',
    samples: [
      { sample_input: '24 36\n', expected_output: '12\n', explanation: 'GCD(24, 36) = 12' }
    ],
    test_cases: [
      { test_input: '24 36\n', expected_output: '12\n', is_hidden: false },
      { test_input: '17 19\n', expected_output: '1\n', is_hidden: true },
      { test_input: '100 10\n', expected_output: '10\n', is_hidden: true },
      { test_input: '48 180\n', expected_output: '12\n', is_hidden: true }
    ],
    starter_code: `#include <stdio.h>

long long gcd(long long a, long long b) {
    while (b != 0) {
        long long temp = b;
        b = a % b;
        a = temp;
    }
    return a;
}

int main() {
    long long a, b;
    if (scanf("%lld %lld", &a, &b) == 2) {
        printf("%lld\\n", gcd(a, b));
    }
    return 0;
}
`
  },
  {
    languageSlug: 'c',
    levelNumber: 5,
    title: 'Nth Fibonacci Number',
    statement: 'Given an integer N (0 <= N <= 30), find the N-th Fibonacci number where F(0) = 0, F(1) = 1, and F(N) = F(N-1) + F(N-2).',
    input_format: 'A single integer N.',
    output_format: 'Print the N-th Fibonacci number.',
    constraints_text: '0 <= N <= 30',
    explanation: 'F(0)=0, F(1)=1, F(2)=1, F(3)=2, F(4)=3, F(5)=5, F(6)=8.',
    samples: [
      { sample_input: '6\n', expected_output: '8\n', explanation: '6th Fibonacci number is 8' }
    ],
    test_cases: [
      { test_input: '6\n', expected_output: '8\n', is_hidden: false },
      { test_input: '0\n', expected_output: '0\n', is_hidden: true },
      { test_input: '1\n', expected_output: '1\n', is_hidden: true },
      { test_input: '10\n', expected_output: '55\n', is_hidden: true },
      { test_input: '20\n', expected_output: '6765\n', is_hidden: true }
    ],
    starter_code: `#include <stdio.h>

long long fib(int n) {
    if (n == 0) return 0;
    if (n == 1) return 1;
    long long a = 0, b = 1, c;
    for (int i = 2; i <= n; i++) {
        c = a + b;
        a = b;
        b = c;
    }
    return b;
}

int main() {
    int n;
    if (scanf("%d", &n) == 1) {
        printf("%lld\\n", fib(n));
    }
    return 0;
}
`
  },
  {
    languageSlug: 'c',
    levelNumber: 5,
    title: 'Check Prime Number',
    statement: 'Implement a function isPrime(n) that checks if an integer N is a prime number. Print "PRIME" if prime, or "NOT PRIME" otherwise.',
    input_format: 'A single integer N.',
    output_format: 'Print "PRIME" or "NOT PRIME".',
    constraints_text: '1 <= N <= 10^7',
    explanation: '7 is prime. 1 is not prime. 4 is not prime.',
    samples: [
      { sample_input: '7\n', expected_output: 'PRIME\n', explanation: '7 has only 1 and 7 as divisors' },
      { sample_input: '1\n', expected_output: 'NOT PRIME\n', explanation: '1 is not prime by definition' }
    ],
    test_cases: [
      { test_input: '7\n', expected_output: 'PRIME\n', is_hidden: false },
      { test_input: '1\n', expected_output: 'NOT PRIME\n', is_hidden: false },
      { test_input: '2\n', expected_output: 'PRIME\n', is_hidden: true },
      { test_input: '4\n', expected_output: 'NOT PRIME\n', is_hidden: true },
      { test_input: '97\n', expected_output: 'PRIME\n', is_hidden: true },
      { test_input: '100\n', expected_output: 'NOT PRIME\n', is_hidden: true }
    ],
    starter_code: `#include <stdio.h>

int isPrime(long long n) {
    if (n <= 1) return 0;
    if (n <= 3) return 1;
    if (n % 2 == 0 || n % 3 == 0) return 0;
    for (long long i = 5; i * i <= n; i += 6) {
        if (n % i == 0 || n % (i + 2) == 0) return 0;
    }
    return 1;
}

int main() {
    long long n;
    if (scanf("%lld", &n) == 1) {
        if (isPrime(n)) printf("PRIME\\n");
        else printf("NOT PRIME\\n");
    }
    return 0;
}
`
  },
  {
    languageSlug: 'c',
    levelNumber: 5,
    title: 'Sum of Digits Using Recursion',
    statement: 'Given a non-negative integer N, write a recursive function to compute the sum of its digits.',
    input_format: 'A single integer N.',
    output_format: 'Print the sum of digits.',
    constraints_text: '0 <= N <= 10^9',
    explanation: 'For 987, 9 + 8 + 7 = 24.',
    samples: [
      { sample_input: '987\n', expected_output: '24\n', explanation: '9+8+7 = 24' }
    ],
    test_cases: [
      { test_input: '987\n', expected_output: '24\n', is_hidden: false },
      { test_input: '0\n', expected_output: '0\n', is_hidden: true },
      { test_input: '5\n', expected_output: '5\n', is_hidden: true },
      { test_input: '123456\n', expected_output: '21\n', is_hidden: true }
    ],
    starter_code: `#include <stdio.h>

int sumDigits(long long n) {
    if (n == 0) return 0;
    return (n % 10) + sumDigits(n / 10);
}

int main() {
    long long n;
    if (scanf("%lld", &n) == 1) {
        printf("%d\\n", sumDigits(n));
    }
    return 0;
}
`
  },

  // =========================================================================
  // LEVEL 6: Pointers & Structures
  // =========================================================================
  {
    languageSlug: 'c',
    levelNumber: 6,
    title: 'Pointer Swap Implementation',
    statement: 'Write a C function swap(int *a, int *b) that swaps two integers using pointers. Print the swapped values separated by a space.',
    input_format: 'Two space-separated integers A and B.',
    output_format: 'Print the swapped integers B and A separated by a space.',
    constraints_text: '-10^5 <= A, B <= 10^5',
    explanation: 'Swap 15 and 30 using pointers gives 30 15.',
    samples: [
      { sample_input: '15 30\n', expected_output: '30 15\n', explanation: 'Swapped: 30 15' }
    ],
    test_cases: [
      { test_input: '15 30\n', expected_output: '30 15\n', is_hidden: false },
      { test_input: '0 0\n', expected_output: '0 0\n', is_hidden: true },
      { test_input: '-5 12\n', expected_output: '12 -5\n', is_hidden: true }
    ],
    starter_code: `#include <stdio.h>

void swap(int *a, int *b) {
    int temp = *a;
    *a = *b;
    *b = temp;
}

int main() {
    int x, y;
    if (scanf("%d %d", &x, &y) == 2) {
        swap(&x, &y);
        printf("%d %d\\n", x, y);
    }
    return 0;
}
`
  },
  {
    languageSlug: 'c',
    levelNumber: 6,
    title: 'Student Record Total Marks',
    statement: 'Define a struct Student with a name string and three subject marks m1, m2, m3. Calculate and print "<name> <total_marks>".',
    input_format: 'First line contains a single name string without spaces, followed by three space-separated integers m1, m2, and m3.',
    output_format: 'Print the student name and total marks separated by a space.',
    constraints_text: '1 <= length(name) <= 50, 0 <= m1, m2, m3 <= 100',
    explanation: 'Alice with marks 80, 85, 90 has total 255.',
    samples: [
      { sample_input: 'Alice 80 85 90\n', expected_output: 'Alice 255\n', explanation: '80+85+90 = 255' }
    ],
    test_cases: [
      { test_input: 'Alice 80 85 90\n', expected_output: 'Alice 255\n', is_hidden: false },
      { test_input: 'Bob 100 100 100\n', expected_output: 'Bob 300\n', is_hidden: true },
      { test_input: 'Charlie 0 50 60\n', expected_output: 'Charlie 110\n', is_hidden: true }
    ],
    starter_code: `#include <stdio.h>

struct Student {
    char name[55];
    int m1, m2, m3;
};

int main() {
    struct Student s;
    if (scanf("%50s %d %d %d", s.name, &s.m1, &s.m2, &s.m3) == 4) {
        int total = s.m1 + s.m2 + s.m3;
        printf("%s %d\\n", s.name, total);
    }
    return 0;
}
`
  },
  {
    languageSlug: 'c',
    levelNumber: 6,
    title: 'Array Reversal via Pointers',
    statement: 'Given an array of N integers, reverse the array in place using two pointers (start and end). Print the reversed array space-separated.',
    input_format: 'The first line contains N. The second line contains N space-separated integers.',
    output_format: 'Print the N reversed elements separated by single spaces on one line.',
    constraints_text: '1 <= N <= 1000, -1000 <= A[i] <= 1000',
    explanation: '[1, 2, 3, 4] reversed is 4 3 2 1.',
    samples: [
      { sample_input: '4\n1 2 3 4\n', expected_output: '4 3 2 1\n', explanation: 'Reversed order' }
    ],
    test_cases: [
      { test_input: '4\n1 2 3 4\n', expected_output: '4 3 2 1\n', is_hidden: false },
      { test_input: '1\n99\n', expected_output: '99\n', is_hidden: true },
      { test_input: '5\n10 20 30 40 50\n', expected_output: '50 40 30 20 10\n', is_hidden: true },
      { test_input: '3\n-1 0 1\n', expected_output: '1 0 -1\n', is_hidden: true }
    ],
    starter_code: `#include <stdio.h>

void reverseArray(int *start, int *end) {
    while (start < end) {
        int temp = *start;
        *start = *end;
        *end = temp;
        start++;
        end--;
    }
}

int main() {
    int n;
    if (scanf("%d", &n) == 1 && n > 0) {
        int arr[1005];
        for (int i = 0; i < n; i++) scanf("%d", &arr[i]);
        reverseArray(arr, arr + n - 1);
        for (int i = 0; i < n; i++) {
            printf("%d%s", arr[i], (i == n - 1) ? "\\n" : " ");
        }
    }
    return 0;
}
`
  },
  {
    languageSlug: 'c',
    levelNumber: 6,
    title: 'Squared Distance Between 2D Points',
    statement: 'Define a struct Point with x and y coordinates. Given two points (x1, y1) and (x2, y2), calculate and print the squared Euclidean distance: (x2 - x1)^2 + (y2 - y1)^2.',
    input_format: 'Four space-separated integers x1, y1, x2, y2.',
    output_format: 'Print the squared distance as an integer.',
    constraints_text: '-1000 <= x1, y1, x2, y2 <= 1000',
    explanation: 'From (0, 0) to (3, 4), distance squared is (3-0)^2 + (4-0)^2 = 9 + 16 = 25.',
    samples: [
      { sample_input: '0 0 3 4\n', expected_output: '25\n', explanation: '3^2 + 4^2 = 25' }
    ],
    test_cases: [
      { test_input: '0 0 3 4\n', expected_output: '25\n', is_hidden: false },
      { test_input: '1 1 1 1\n', expected_output: '0\n', is_hidden: true },
      { test_input: '-2 -3 4 5\n', expected_output: '100\n', is_hidden: true },
      { test_input: '10 0 0 10\n', expected_output: '200\n', is_hidden: true }
    ],
    starter_code: `#include <stdio.h>

struct Point {
    int x, y;
};

int main() {
    struct Point p1, p2;
    if (scanf("%d %d %d %d", &p1.x, &p1.y, &p2.x, &p2.y) == 4) {
        int dx = p2.x - p1.x;
        int dy = p2.y - p1.y;
        printf("%d\\n", dx * dx + dy * dy);
    }
    return 0;
}
`
  },
  {
    languageSlug: 'c',
    levelNumber: 6,
    title: 'Dynamic Array Allocation and Sum',
    statement: 'Read N integers into dynamically allocated memory using malloc, compute their sum, free the allocated buffer, and print the sum.',
    input_format: 'The first line contains N. The second line contains N space-separated integers.',
    output_format: 'Print the sum on a single line.',
    constraints_text: '1 <= N <= 10000, -1000 <= A[i] <= 1000',
    explanation: 'Sum of [10, 20, 30] is 60.',
    samples: [
      { sample_input: '3\n10 20 30\n', expected_output: '60\n', explanation: '10+20+30 = 60' }
    ],
    test_cases: [
      { test_input: '3\n10 20 30\n', expected_output: '60\n', is_hidden: false },
      { test_input: '1\n-5\n', expected_output: '-5\n', is_hidden: true },
      { test_input: '5\n1 2 3 4 5\n', expected_output: '15\n', is_hidden: true }
    ],
    starter_code: `#include <stdio.h>
#include <stdlib.h>

int main() {
    int n;
    if (scanf("%d", &n) == 1 && n > 0) {
        int *arr = (int *)malloc(n * sizeof(int));
        long long sum = 0;
        for (int i = 0; i < n; i++) {
            scanf("%d", &arr[i]);
            sum += arr[i];
        }
        printf("%lld\\n", sum);
        free(arr);
    }
    return 0;
}
`
  }
];

module.exports = cQuestions;
