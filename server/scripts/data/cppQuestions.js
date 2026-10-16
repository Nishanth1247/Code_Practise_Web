/**
 * Seed questions for C++ track (6 levels x 5 questions = 30 questions)
 * Curriculum:
 * Level 1: Basics & Streams
 * Level 2: Decisions & Logic
 * Level 3: Looping & Patterns
 * Level 4: Vectors & Strings
 * Level 5: Functions & References
 * Level 6: OOP & STL Fundamentals
 */

const cppQuestions = [
  // =========================================================================
  // LEVEL 1: Basics & Streams
  // =========================================================================
  {
    languageSlug: 'cpp',
    levelNumber: 1,
    title: 'Standard Greeting with C++ Streams',
    statement: 'Given a username string from std::cin, print a personalized welcome message: "Hello, <username>!".',
    input_format: 'A single word string representing the username.',
    output_format: 'Print "Hello, <username>!".',
    constraints_text: '1 <= length <= 50',
    explanation: 'If input is Alex, output is Hello, Alex!.',
    samples: [
      { sample_input: 'Alex\n', expected_output: 'Hello, Alex!\n', explanation: 'Personalized greeting' }
    ],
    test_cases: [
      { test_input: 'Alex\n', expected_output: 'Hello, Alex!\n', is_hidden: false },
      { test_input: 'Developer\n', expected_output: 'Hello, Developer!\n', is_hidden: true },
      { test_input: 'Cplusplus\n', expected_output: 'Hello, Cplusplus!\n', is_hidden: true }
    ],
    starter_code: `#include <iostream>
#include <string>

int main() {
    std::string name;
    if (std::cin >> name) {
        std::cout << "Hello, " << name << "!" << std::endl;
    }
    return 0;
}
`
  },
  {
    languageSlug: 'cpp',
    levelNumber: 1,
    title: 'Cube of an Integer',
    statement: 'Given an integer N, compute and print its cube (N^3) to standard output.',
    input_format: 'A single integer N.',
    output_format: 'Print N^3 on a single line.',
    constraints_text: '-1000 <= N <= 1000',
    explanation: 'For 3, 3 * 3 * 3 = 27. For -4, -4 * -4 * -4 = -64.',
    samples: [
      { sample_input: '3\n', expected_output: '27\n', explanation: '3^3 = 27' },
      { sample_input: '-4\n', expected_output: '-64\n', explanation: '(-4)^3 = -64' }
    ],
    test_cases: [
      { test_input: '3\n', expected_output: '27\n', is_hidden: false },
      { test_input: '-4\n', expected_output: '-64\n', is_hidden: false },
      { test_input: '0\n', expected_output: '0\n', is_hidden: true },
      { test_input: '10\n', expected_output: '1000\n', is_hidden: true },
      { test_input: '-10\n', expected_output: '-1000\n', is_hidden: true }
    ],
    starter_code: `#include <iostream>

int main() {
    long long n;
    if (std::cin >> n) {
        std::cout << n * n * n << std::endl;
    }
    return 0;
}
`
  },
  {
    languageSlug: 'cpp',
    levelNumber: 1,
    title: 'Quotient and Remainder',
    statement: 'Given two positive integers A and B, compute and print their quotient (A / B) and remainder (A % B) separated by a space.',
    input_format: 'Two space-separated integers A and B.',
    output_format: 'Print two space-separated integers: Quotient and Remainder.',
    constraints_text: '1 <= A <= 10^9, 1 <= B <= 10^9',
    explanation: 'For 17 and 5: 17 / 5 = 3 with remainder 2.',
    samples: [
      { sample_input: '17 5\n', expected_output: '3 2\n', explanation: '17 = 5 * 3 + 2' }
    ],
    test_cases: [
      { test_input: '17 5\n', expected_output: '3 2\n', is_hidden: false },
      { test_input: '20 4\n', expected_output: '5 0\n', is_hidden: true },
      { test_input: '3 7\n', expected_output: '0 3\n', is_hidden: true },
      { test_input: '100 10\n', expected_output: '10 0\n', is_hidden: true }
    ],
    starter_code: `#include <iostream>

int main() {
    long long a, b;
    if (std::cin >> a >> b) {
        std::cout << (a / b) << " " << (a % b) << std::endl;
    }
    return 0;
}
`
  },
  {
    languageSlug: 'cpp',
    levelNumber: 1,
    title: 'Character ASCII Code',
    statement: 'Read a single character C from input and print its integer ASCII code value.',
    input_format: 'A single non-whitespace character C.',
    output_format: 'Print the ASCII integer code.',
    constraints_text: 'Printable ASCII character',
    explanation: 'Character \'A\' has ASCII value 65.',
    samples: [
      { sample_input: 'A\n', expected_output: '65\n', explanation: 'ASCII code of A is 65' },
      { sample_input: 'z\n', expected_output: '122\n', explanation: 'ASCII code of z is 122' }
    ],
    test_cases: [
      { test_input: 'A\n', expected_output: '65\n', is_hidden: false },
      { test_input: 'z\n', expected_output: '122\n', is_hidden: false },
      { test_input: '0\n', expected_output: '48\n', is_hidden: true },
      { test_input: '#\n', expected_output: '35\n', is_hidden: true }
    ],
    starter_code: `#include <iostream>

int main() {
    char c;
    if (std::cin >> c) {
        std::cout << static_cast<int>(c) << std::endl;
    }
    return 0;
}
`
  },
  {
    languageSlug: 'cpp',
    levelNumber: 1,
    title: 'Average of Three Integers',
    statement: 'Given three integers A, B, and C, compute and print their integer average using integer division: (A + B + C) / 3.',
    input_format: 'Three space-separated integers A, B, and C.',
    output_format: 'Print the integer average.',
    constraints_text: '-10000 <= A, B, C <= 10000',
    explanation: '(10 + 20 + 30) / 3 = 20.',
    samples: [
      { sample_input: '10 20 30\n', expected_output: '20\n', explanation: '60 / 3 = 20' }
    ],
    test_cases: [
      { test_input: '10 20 30\n', expected_output: '20\n', is_hidden: false },
      { test_input: '4 5 6\n', expected_output: '5\n', is_hidden: true },
      { test_input: '1 2 4\n', expected_output: '2\n', is_hidden: true },
      { test_input: '-3 0 3\n', expected_output: '0\n', is_hidden: true }
    ],
    starter_code: `#include <iostream>

int main() {
    int a, b, c;
    if (std::cin >> a >> b >> c) {
        std::cout << (a + b + c) / 3 << std::endl;
    }
    return 0;
}
`
  },

  // =========================================================================
  // LEVEL 2: Decisions & Logic
  // =========================================================================
  {
    languageSlug: 'cpp',
    levelNumber: 2,
    title: 'Sign of a Number',
    statement: 'Given an integer N, print "POSITIVE" if N > 0, "NEGATIVE" if N < 0, or "ZERO" if N == 0.',
    input_format: 'A single integer N.',
    output_format: 'Print "POSITIVE", "NEGATIVE", or "ZERO".',
    constraints_text: '-10^9 <= N <= 10^9',
    explanation: 'For -42, output is NEGATIVE.',
    samples: [
      { sample_input: '-42\n', expected_output: 'NEGATIVE\n', explanation: 'Less than zero' },
      { sample_input: '0\n', expected_output: 'ZERO\n', explanation: 'Equal to zero' }
    ],
    test_cases: [
      { test_input: '-42\n', expected_output: 'NEGATIVE\n', is_hidden: false },
      { test_input: '0\n', expected_output: 'ZERO\n', is_hidden: false },
      { test_input: '100\n', expected_output: 'POSITIVE\n', is_hidden: true },
      { test_input: '-1\n', expected_output: 'NEGATIVE\n', is_hidden: true }
    ],
    starter_code: `#include <iostream>

int main() {
    long long n;
    if (std::cin >> n) {
        if (n > 0) std::cout << "POSITIVE\\n";
        else if (n < 0) std::cout << "NEGATIVE\\n";
        else std::cout << "ZERO\\n";
    }
    return 0;
}
`
  },
  {
    languageSlug: 'cpp',
    levelNumber: 2,
    title: 'Divisible by Both 3 and 5',
    statement: 'Given an integer N, determine if it is divisible by both 3 and 5. Print "YES" if divisible by both, or "NO" otherwise.',
    input_format: 'A single integer N.',
    output_format: 'Print "YES" or "NO".',
    constraints_text: '1 <= N <= 10^9',
    explanation: '15 is divisible by 3 and 5, so YES. 9 is divisible by 3 but not 5, so NO.',
    samples: [
      { sample_input: '15\n', expected_output: 'YES\n', explanation: '15 % 15 == 0' },
      { sample_input: '9\n', expected_output: 'NO\n', explanation: '9 is not divisible by 5' }
    ],
    test_cases: [
      { test_input: '15\n', expected_output: 'YES\n', is_hidden: false },
      { test_input: '9\n', expected_output: 'NO\n', is_hidden: false },
      { test_input: '30\n', expected_output: 'YES\n', is_hidden: true },
      { test_input: '25\n', expected_output: 'NO\n', is_hidden: true },
      { test_input: '1500\n', expected_output: 'YES\n', is_hidden: true }
    ],
    starter_code: `#include <iostream>

int main() {
    long long n;
    if (std::cin >> n) {
        if (n % 3 == 0 && n % 5 == 0) std::cout << "YES\\n";
        else std::cout << "NO\\n";
    }
    return 0;
}
`
  },
  {
    languageSlug: 'cpp',
    levelNumber: 2,
    title: 'Quadrant of a 2D Coordinate',
    statement: 'Given non-zero coordinates X and Y of a point in a 2D Cartesian plane, identify which quadrant it lies in: "Q1" (X>0, Y>0), "Q2" (X<0, Y>0), "Q3" (X<0, Y<0), or "Q4" (X>0, Y<0).',
    input_format: 'Two space-separated non-zero integers X and Y.',
    output_format: 'Print "Q1", "Q2", "Q3", or "Q4".',
    constraints_text: '-10^4 <= X, Y <= 10^4 and X, Y != 0',
    explanation: '(3, -5) has positive X and negative Y, so Q4.',
    samples: [
      { sample_input: '3 -5\n', expected_output: 'Q4\n', explanation: 'Fourth quadrant' }
    ],
    test_cases: [
      { test_input: '3 -5\n', expected_output: 'Q4\n', is_hidden: false },
      { test_input: '5 5\n', expected_output: 'Q1\n', is_hidden: true },
      { test_input: '-2 4\n', expected_output: 'Q2\n', is_hidden: true },
      { test_input: '-3 -3\n', expected_output: 'Q3\n', is_hidden: true }
    ],
    starter_code: `#include <iostream>

int main() {
    int x, y;
    if (std::cin >> x >> y) {
        if (x > 0 && y > 0) std::cout << "Q1\\n";
        else if (x < 0 && y > 0) std::cout << "Q2\\n";
        else if (x < 0 && y < 0) std::cout << "Q3\\n";
        else std::cout << "Q4\\n";
    }
    return 0;
}
`
  },
  {
    languageSlug: 'cpp',
    levelNumber: 2,
    title: 'Smallest of Three Numbers',
    statement: 'Given three integers A, B, and C, find and print the smallest value among them.',
    input_format: 'Three space-separated integers A, B, and C.',
    output_format: 'Print the minimum integer.',
    constraints_text: '-10^5 <= A, B, C <= 10^5',
    explanation: 'Among 18, 5, and 23, 5 is the smallest.',
    samples: [
      { sample_input: '18 5 23\n', expected_output: '5\n', explanation: 'Smallest is 5' }
    ],
    test_cases: [
      { test_input: '18 5 23\n', expected_output: '5\n', is_hidden: false },
      { test_input: '1 2 3\n', expected_output: '1\n', is_hidden: true },
      { test_input: '-10 -5 0\n', expected_output: '-10\n', is_hidden: true },
      { test_input: '9 9 9\n', expected_output: '9\n', is_hidden: true }
    ],
    starter_code: `#include <iostream>
#include <algorithm>

int main() {
    int a, b, c;
    if (std::cin >> a >> b >> c) {
        std::cout << std::min({a, b, c}) << std::endl;
    }
    return 0;
}
`
  },
  {
    languageSlug: 'cpp',
    levelNumber: 2,
    title: 'Vowel or Consonant',
    statement: 'Given a single lowercase English letter, print "VOWEL" if it is one of (a, e, i, o, u), or "CONSONANT" otherwise.',
    input_format: 'A single lowercase letter.',
    output_format: 'Print "VOWEL" or "CONSONANT".',
    constraints_text: 'Input is a lowercase character between \'a\' and \'z\'.',
    explanation: '\'e\' is a vowel, while \'k\' is a consonant.',
    samples: [
      { sample_input: 'e\n', expected_output: 'VOWEL\n', explanation: 'e is a vowel' },
      { sample_input: 'k\n', expected_output: 'CONSONANT\n', explanation: 'k is a consonant' }
    ],
    test_cases: [
      { test_input: 'e\n', expected_output: 'VOWEL\n', is_hidden: false },
      { test_input: 'k\n', expected_output: 'CONSONANT\n', is_hidden: false },
      { test_input: 'a\n', expected_output: 'VOWEL\n', is_hidden: true },
      { test_input: 'u\n', expected_output: 'VOWEL\n', is_hidden: true },
      { test_input: 'z\n', expected_output: 'CONSONANT\n', is_hidden: true }
    ],
    starter_code: `#include <iostream>

int main() {
    char c;
    if (std::cin >> c) {
        if (c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u') {
            std::cout << "VOWEL\\n";
        } else {
            std::cout << "CONSONANT\\n";
        }
    }
    return 0;
}
`
  },

  // =========================================================================
  // LEVEL 3: Looping & Patterns
  // =========================================================================
  {
    languageSlug: 'cpp',
    levelNumber: 3,
    title: 'Sum of Even Numbers up to N',
    statement: 'Given a positive integer N, calculate the sum of all even integers from 2 up to N inclusive.',
    input_format: 'A single integer N.',
    output_format: 'Print the sum of even numbers.',
    constraints_text: '1 <= N <= 10^5',
    explanation: 'For N = 6, even numbers are 2, 4, 6. Sum = 12.',
    samples: [
      { sample_input: '6\n', expected_output: '12\n', explanation: '2 + 4 + 6 = 12' }
    ],
    test_cases: [
      { test_input: '6\n', expected_output: '12\n', is_hidden: false },
      { test_input: '1\n', expected_output: '0\n', is_hidden: true },
      { test_input: '10\n', expected_output: '30\n', is_hidden: true },
      { test_input: '100\n', expected_output: '2550\n', is_hidden: true }
    ],
    starter_code: `#include <iostream>

int main() {
    long long n;
    if (std::cin >> n) {
        long long sum = 0;
        for (long long i = 2; i <= n; i += 2) {
            sum += i;
        }
        std::cout << sum << std::endl;
    }
    return 0;
}
`
  },
  {
    languageSlug: 'cpp',
    levelNumber: 3,
    title: 'Print Numbers in Reverse',
    statement: 'Given a positive integer N, print all numbers from N down to 1 space-separated on a single line.',
    input_format: 'A single integer N.',
    output_format: 'Print N numbers from N down to 1 separated by spaces.',
    constraints_text: '1 <= N <= 1000',
    explanation: 'For N = 5, output is 5 4 3 2 1.',
    samples: [
      { sample_input: '5\n', expected_output: '5 4 3 2 1\n', explanation: 'Countdown sequence' }
    ],
    test_cases: [
      { test_input: '5\n', expected_output: '5 4 3 2 1\n', is_hidden: false },
      { test_input: '1\n', expected_output: '1\n', is_hidden: true },
      { test_input: '3\n', expected_output: '3 2 1\n', is_hidden: true }
    ],
    starter_code: `#include <iostream>

int main() {
    int n;
    if (std::cin >> n) {
        for (int i = n; i >= 1; i--) {
            std::cout << i << (i == 1 ? "" : " ");
        }
        std::cout << std::endl;
    }
    return 0;
}
`
  },
  {
    languageSlug: 'cpp',
    levelNumber: 3,
    title: 'Check Armstrong Number',
    statement: 'An Armstrong number of 3 digits is an integer such that the sum of the cubes of its digits equals the number itself (e.g. 153 = 1^3 + 5^3 + 3^3). Given a 3-digit number N, print "YES" if it is Armstrong, else "NO".',
    input_format: 'A single 3-digit integer N.',
    output_format: 'Print "YES" or "NO".',
    constraints_text: '100 <= N <= 999',
    explanation: '153 = 1 + 125 + 27 = 153, so YES. 120 = 1 + 8 + 0 = 9 != 120, so NO.',
    samples: [
      { sample_input: '153\n', expected_output: 'YES\n', explanation: '1^3 + 5^3 + 3^3 = 153' },
      { sample_input: '120\n', expected_output: 'NO\n', explanation: '1^3 + 2^3 + 0^3 = 9 != 120' }
    ],
    test_cases: [
      { test_input: '153\n', expected_output: 'YES\n', is_hidden: false },
      { test_input: '120\n', expected_output: 'NO\n', is_hidden: false },
      { test_input: '370\n', expected_output: 'YES\n', is_hidden: true },
      { test_input: '371\n', expected_output: 'YES\n', is_hidden: true },
      { test_input: '407\n', expected_output: 'YES\n', is_hidden: true },
      { test_input: '500\n', expected_output: 'NO\n', is_hidden: true }
    ],
    starter_code: `#include <iostream>

int main() {
    int n;
    if (std::cin >> n) {
        int temp = n, sum = 0;
        while (temp > 0) {
            int d = temp % 10;
            sum += (d * d * d);
            temp /= 10;
        }
        if (sum == n) std::cout << "YES\\n";
        else std::cout << "NO\\n";
    }
    return 0;
}
`
  },
  {
    languageSlug: 'cpp',
    levelNumber: 3,
    title: 'Binary to Decimal Conversion',
    statement: 'Given a binary string S (consisting of 0s and 1s), convert and print its value in decimal base 10.',
    input_format: 'A binary string S.',
    output_format: 'Print the decimal integer.',
    constraints_text: '1 <= length(S) <= 30',
    explanation: 'Binary "1010" in decimal is 1*8 + 0*4 + 1*2 + 0*1 = 10.',
    samples: [
      { sample_input: '1010\n', expected_output: '10\n', explanation: '1010 in base 2 is 10' }
    ],
    test_cases: [
      { test_input: '1010\n', expected_output: '10\n', is_hidden: false },
      { test_input: '0\n', expected_output: '0\n', is_hidden: true },
      { test_input: '1\n', expected_output: '1\n', is_hidden: true },
      { test_input: '11111111\n', expected_output: '255\n', is_hidden: true },
      { test_input: '100000000\n', expected_output: '256\n', is_hidden: true }
    ],
    starter_code: `#include <iostream>
#include <string>

int main() {
    std::string s;
    if (std::cin >> s) {
        long long dec = 0;
        for (char c : s) {
            dec = dec * 2 + (c - '0');
        }
        std::cout << dec << std::endl;
    }
    return 0;
}
`
  },
  {
    languageSlug: 'cpp',
    levelNumber: 3,
    title: 'Count Divisors of N',
    statement: 'Given a positive integer N, count and print the total number of positive divisors of N.',
    input_format: 'A single integer N.',
    output_format: 'Print the count of divisors.',
    constraints_text: '1 <= N <= 10^6',
    explanation: 'Divisors of 12 are 1, 2, 3, 4, 6, 12 (6 divisors).',
    samples: [
      { sample_input: '12\n', expected_output: '6\n', explanation: '1, 2, 3, 4, 6, 12' }
    ],
    test_cases: [
      { test_input: '12\n', expected_output: '6\n', is_hidden: false },
      { test_input: '1\n', expected_output: '1\n', is_hidden: true },
      { test_input: '7\n', expected_output: '2\n', is_hidden: true },
      { test_input: '16\n', expected_output: '5\n', is_hidden: true },
      { test_input: '100\n', expected_output: '9\n', is_hidden: true }
    ],
    starter_code: `#include <iostream>

int main() {
    long long n;
    if (std::cin >> n) {
        long long count = 0;
        for (long long i = 1; i * i <= n; i++) {
            if (n % i == 0) {
                count++;
                if (i * i != n) count++;
            }
        }
        std::cout << count << std::endl;
    }
    return 0;
}
`
  },

  // =========================================================================
  // LEVEL 4: Vectors & Strings
  // =========================================================================
  {
    languageSlug: 'cpp',
    levelNumber: 4,
    title: 'Vector Linear Search',
    statement: 'Given N integers stored in a std::vector and a target value X, find the 0-based index of the first occurrence of X. If not found, print -1.',
    input_format: 'The first line contains N. The second line contains N integers. The third line contains X.',
    output_format: 'Print the 0-based index or -1.',
    constraints_text: '1 <= N <= 1000, -10^5 <= A[i], X <= 10^5',
    explanation: 'In [10, 25, 40, 55], target 40 is at index 2.',
    samples: [
      { sample_input: '4\n10 25 40 55\n40\n', expected_output: '2\n', explanation: 'Index 2' }
    ],
    test_cases: [
      { test_input: '4\n10 25 40 55\n40\n', expected_output: '2\n', is_hidden: false },
      { test_input: '3\n1 2 3\n5\n', expected_output: '-1\n', is_hidden: true },
      { test_input: '1\n99\n99\n', expected_output: '0\n', is_hidden: true }
    ],
    starter_code: `#include <iostream>
#include <vector>

int main() {
    int n;
    if (std::cin >> n) {
        std::vector<int> v(n);
        for (int i = 0; i < n; i++) std::cin >> v[i];
        int x;
        std::cin >> x;
        int ans = -1;
        for (int i = 0; i < n; i++) {
            if (v[i] == x) {
                ans = i;
                break;
            }
        }
        std::cout << ans << std::endl;
    }
    return 0;
}
`
  },
  {
    languageSlug: 'cpp',
    levelNumber: 4,
    title: 'Remove Duplicates from Sorted Vector',
    statement: 'Given N integers in non-decreasing sorted order, remove adjacent duplicates and print the unique elements space-separated.',
    input_format: 'First line contains N. Second line contains N sorted integers.',
    output_format: 'Print unique elements separated by space on one line.',
    constraints_text: '1 <= N <= 1000, -10^5 <= A[i] <= 10^5',
    explanation: '[1, 1, 2, 3, 3, 4] -> 1 2 3 4.',
    samples: [
      { sample_input: '6\n1 1 2 3 3 4\n', expected_output: '1 2 3 4\n', explanation: 'Unique elements in order' }
    ],
    test_cases: [
      { test_input: '6\n1 1 2 3 3 4\n', expected_output: '1 2 3 4\n', is_hidden: false },
      { test_input: '4\n5 5 5 5\n', expected_output: '5\n', is_hidden: true },
      { test_input: '3\n10 20 30\n', expected_output: '10 20 30\n', is_hidden: true }
    ],
    starter_code: `#include <iostream>
#include <vector>

int main() {
    int n;
    if (std::cin >> n && n > 0) {
        std::vector<int> v(n);
        for (int i = 0; i < n; i++) std::cin >> v[i];
        std::vector<int> u;
        u.push_back(v[0]);
        for (int i = 1; i < n; i++) {
            if (v[i] != v[i - 1]) u.push_back(v[i]);
        }
        for (size_t i = 0; i < u.size(); i++) {
            std::cout << u[i] << (i + 1 == u.size() ? "" : " ");
        }
        std::cout << std::endl;
    }
    return 0;
}
`
  },
  {
    languageSlug: 'cpp',
    levelNumber: 4,
    title: 'Convert String to Uppercase',
    statement: 'Given a word containing letters, convert all lowercase characters to uppercase and print the resulting string.',
    input_format: 'A single word string.',
    output_format: 'Print the uppercase string.',
    constraints_text: '1 <= length <= 100',
    explanation: '"cppCode" becomes "CPPCODE".',
    samples: [
      { sample_input: 'cppCode\n', expected_output: 'CPPCODE\n', explanation: 'All letters converted to uppercase' }
    ],
    test_cases: [
      { test_input: 'cppCode\n', expected_output: 'CPPCODE\n', is_hidden: false },
      { test_input: 'hello\n', expected_output: 'HELLO\n', is_hidden: true },
      { test_input: 'TEST\n', expected_output: 'TEST\n', is_hidden: true }
    ],
    starter_code: `#include <iostream>
#include <string>
#include <cctype>

int main() {
    std::string s;
    if (std::cin >> s) {
        for (char &c : s) {
            c = std::toupper(c);
        }
        std::cout << s << std::endl;
    }
    return 0;
}
`
  },
  {
    languageSlug: 'cpp',
    levelNumber: 4,
    title: 'Prefix Sums of Vector',
    statement: 'Given N integers, compute the prefix sums array P where P[i] = A[0] + A[1] + ... + A[i]. Print P space-separated.',
    input_format: 'First line contains N. Second line contains N integers.',
    output_format: 'Print the prefix sum array separated by spaces.',
    constraints_text: '1 <= N <= 1000, -1000 <= A[i] <= 1000',
    explanation: 'For [1, 2, 3, 4], prefix sums are 1, 3, 6, 10.',
    samples: [
      { sample_input: '4\n1 2 3 4\n', expected_output: '1 3 6 10\n', explanation: 'Cumulative sums' }
    ],
    test_cases: [
      { test_input: '4\n1 2 3 4\n', expected_output: '1 3 6 10\n', is_hidden: false },
      { test_input: '3\n5 -2 7\n', expected_output: '5 3 10\n', is_hidden: true },
      { test_input: '1\n10\n', expected_output: '10\n', is_hidden: true }
    ],
    starter_code: `#include <iostream>
#include <vector>

int main() {
    int n;
    if (std::cin >> n && n > 0) {
        std::vector<long long> v(n);
        long long run = 0;
        for (int i = 0; i < n; i++) {
            long long x;
            std::cin >> x;
            run += x;
            std::cout << run << (i == n - 1 ? "" : " ");
        }
        std::cout << std::endl;
    }
    return 0;
}
`
  },
  {
    languageSlug: 'cpp',
    levelNumber: 4,
    title: 'Count Uppercase and Lowercase Letters',
    statement: 'Given a word containing English letters, count and print the number of uppercase and lowercase letters separated by a space.',
    input_format: 'A single word string.',
    output_format: 'Print two space-separated integers: UppercaseCount and LowercaseCount.',
    constraints_text: '1 <= length <= 100',
    explanation: 'In "HelloWORLD", there are 6 uppercase (H, W, O, R, L, D) and 4 lowercase (e, l, l, o).',
    samples: [
      { sample_input: 'HelloWORLD\n', expected_output: '6 4\n', explanation: '6 uppercase, 4 lowercase' }
    ],
    test_cases: [
      { test_input: 'HelloWORLD\n', expected_output: '6 4\n', is_hidden: false },
      { test_input: 'abc\n', expected_output: '0 3\n', is_hidden: true },
      { test_input: 'XYZ\n', expected_output: '3 0\n', is_hidden: true }
    ],
    starter_code: `#include <iostream>
#include <string>
#include <cctype>

int main() {
    std::string s;
    if (std::cin >> s) {
        int upper = 0, lower = 0;
        for (char c : s) {
            if (std::isupper(c)) upper++;
            else if (std::islower(c)) lower++;
        }
        std::cout << upper << " " << lower << std::endl;
    }
    return 0;
}
`
  },

  // =========================================================================
  // LEVEL 5: Functions & References
  // =========================================================================
  {
    languageSlug: 'cpp',
    levelNumber: 5,
    title: 'Double Values in Place via Reference',
    statement: 'Implement a function doubleValues(int &a, int &b) using C++ references that multiplies both integers by 2 in place. Print the doubled values space-separated.',
    input_format: 'Two space-separated integers A and B.',
    output_format: 'Print the two doubled values separated by a space.',
    constraints_text: '-10^4 <= A, B <= 10^4',
    explanation: 'If inputs are 5 and 12, doubled values are 10 and 24.',
    samples: [
      { sample_input: '5 12\n', expected_output: '10 24\n', explanation: '5*2=10, 12*2=24' }
    ],
    test_cases: [
      { test_input: '5 12\n', expected_output: '10 24\n', is_hidden: false },
      { test_input: '0 -7\n', expected_output: '0 -14\n', is_hidden: true },
      { test_input: '100 200\n', expected_output: '200 400\n', is_hidden: true }
    ],
    starter_code: `#include <iostream>

void doubleValues(int &a, int &b) {
    a *= 2;
    b *= 2;
}

int main() {
    int x, y;
    if (std::cin >> x >> y) {
        doubleValues(x, y);
        std::cout << x << " " << y << std::endl;
    }
    return 0;
}
`
  },
  {
    languageSlug: 'cpp',
    levelNumber: 5,
    title: 'Modular Exponentiation Function',
    statement: 'Implement a function powerMod(base, exp, mod) to compute (base^exp) % mod using fast binary exponentiation.',
    input_format: 'Three space-separated integers: Base, Exp, and Mod.',
    output_format: 'Print the modular exponentiation result.',
    constraints_text: '1 <= Base, Mod <= 10^9, 0 <= Exp <= 10^9',
    explanation: '2^10 = 1024, 1024 % 1000 = 24.',
    samples: [
      { sample_input: '2 10 1000\n', expected_output: '24\n', explanation: '2^10 % 1000 = 24' }
    ],
    test_cases: [
      { test_input: '2 10 1000\n', expected_output: '24\n', is_hidden: false },
      { test_input: '3 5 7\n', expected_output: '5\n', is_hidden: true },
      { test_input: '10 0 13\n', expected_output: '1\n', is_hidden: true }
    ],
    starter_code: `#include <iostream>

long long powerMod(long long base, long long exp, long long mod) {
    long long res = 1;
    base %= mod;
    while (exp > 0) {
        if (exp % 2 == 1) res = (res * base) % mod;
        base = (base * base) % mod;
        exp /= 2;
    }
    return res;
}

int main() {
    long long b, e, m;
    if (std::cin >> b >> e >> m) {
        std::cout << powerMod(b, e, m) << std::endl;
    }
    return 0;
}
`
  },
  {
    languageSlug: 'cpp',
    levelNumber: 5,
    title: 'Binomial Coefficient nCr',
    statement: 'Write a function to calculate the combinations nCr = n! / (r! * (n - r)!).',
    input_format: 'Two space-separated integers N and R.',
    output_format: 'Print nCr on a single line.',
    constraints_text: '0 <= R <= N <= 30',
    explanation: '5C2 = (5 * 4) / (2 * 1) = 10.',
    samples: [
      { sample_input: '5 2\n', expected_output: '10\n', explanation: '5C2 = 10' }
    ],
    test_cases: [
      { test_input: '5 2\n', expected_output: '10\n', is_hidden: false },
      { test_input: '6 0\n', expected_output: '1\n', is_hidden: true },
      { test_input: '10 5\n', expected_output: '252\n', is_hidden: true },
      { test_input: '20 10\n', expected_output: '184756\n', is_hidden: true }
    ],
    starter_code: `#include <iostream>

long long nCr(int n, int r) {
    if (r < 0 || r > n) return 0;
    if (r == 0 || r == n) return 1;
    if (r > n / 2) r = n - r;
    long long res = 1;
    for (int i = 1; i <= r; i++) {
        res = res * (n - i + 1) / i;
    }
    return res;
}

int main() {
    int n, r;
    if (std::cin >> n >> r) {
        std::cout << nCr(n, r) << std::endl;
    }
    return 0;
}
`
  },
  {
    languageSlug: 'cpp',
    levelNumber: 5,
    title: 'Check Perfect Number',
    statement: 'A perfect number is a positive integer equal to the sum of its proper positive divisors (excluding itself). Check if N is a perfect number and print "YES" or "NO".',
    input_format: 'A single integer N.',
    output_format: 'Print "YES" or "NO".',
    constraints_text: '1 <= N <= 10^8',
    explanation: '6 has divisors 1, 2, 3; sum = 6, so YES.',
    samples: [
      { sample_input: '6\n', expected_output: 'YES\n', explanation: '1+2+3 = 6' },
      { sample_input: '10\n', expected_output: 'NO\n', explanation: '1+2+5 = 8 != 10' }
    ],
    test_cases: [
      { test_input: '6\n', expected_output: 'YES\n', is_hidden: false },
      { test_input: '10\n', expected_output: 'NO\n', is_hidden: false },
      { test_input: '28\n', expected_output: 'YES\n', is_hidden: true },
      { test_input: '496\n', expected_output: 'YES\n', is_hidden: true },
      { test_input: '1\n', expected_output: 'NO\n', is_hidden: true }
    ],
    starter_code: `#include <iostream>

bool isPerfect(long long n) {
    if (n <= 1) return false;
    long long sum = 1;
    for (long long i = 2; i * i <= n; i++) {
        if (n % i == 0) {
            sum += i;
            if (i * i != n) sum += (n / i);
        }
    }
    return sum == n;
}

int main() {
    long long n;
    if (std::cin >> n) {
        std::cout << (isPerfect(n) ? "YES" : "NO") << std::endl;
    }
    return 0;
}
`
  },
  {
    languageSlug: 'cpp',
    levelNumber: 5,
    title: 'Vector Median Calculation',
    statement: 'Given an odd integer N followed by N integers, find and print the median element after sorting.',
    input_format: 'First line contains odd integer N. Second line contains N integers.',
    output_format: 'Print the median integer.',
    constraints_text: '1 <= N <= 1001 (N is odd), -10^5 <= A[i] <= 10^5',
    explanation: '[7, 1, 3] sorted is [1, 3, 7]; median is 3.',
    samples: [
      { sample_input: '3\n7 1 3\n', expected_output: '3\n', explanation: 'Median of sorted [1, 3, 7] is 3' }
    ],
    test_cases: [
      { test_input: '3\n7 1 3\n', expected_output: '3\n', is_hidden: false },
      { test_input: '5\n10 50 20 40 30\n', expected_output: '30\n', is_hidden: true },
      { test_input: '1\n42\n', expected_output: '42\n', is_hidden: true }
    ],
    starter_code: `#include <iostream>
#include <vector>
#include <algorithm>

int main() {
    int n;
    if (std::cin >> n && n > 0) {
        std::vector<int> v(n);
        for (int i = 0; i < n; i++) std::cin >> v[i];
        std::sort(v.begin(), v.end());
        std::cout << v[n / 2] << std::endl;
    }
    return 0;
}
`
  },

  // =========================================================================
  // LEVEL 6: OOP & STL Fundamentals
  // =========================================================================
  {
    languageSlug: 'cpp',
    levelNumber: 6,
    title: 'Rectangle Class Area',
    statement: 'Define a C++ class Rectangle with private members width and height, a parameterized constructor, and a public method area(). Read width and height and print the area.',
    input_format: 'Two space-separated integers width and height.',
    output_format: 'Print the area.',
    constraints_text: '1 <= width, height <= 1000',
    explanation: 'For width 6 and height 8, area is 48.',
    samples: [
      { sample_input: '6 8\n', expected_output: '48\n', explanation: '6 * 8 = 48' }
    ],
    test_cases: [
      { test_input: '6 8\n', expected_output: '48\n', is_hidden: false },
      { test_input: '10 10\n', expected_output: '100\n', is_hidden: true },
      { test_input: '1 5\n', expected_output: '5\n', is_hidden: true }
    ],
    starter_code: `#include <iostream>

class Rectangle {
private:
    int width, height;
public:
    Rectangle(int w, int h) : width(w), height(h) {}
    long long area() const {
        return static_cast<long long>(width) * height;
    }
};

int main() {
    int w, h;
    if (std::cin >> w >> h) {
        Rectangle r(w, h);
        std::cout << r.area() << std::endl;
    }
    return 0;
}
`
  },
  {
    languageSlug: 'cpp',
    levelNumber: 6,
    title: 'Word Frequency with std::map',
    statement: 'Given N words, use std::map to count occurrences of each unique word. Print each word and its count in alphabetical order, one per line as "<word> <count>".',
    input_format: 'The first line contains N. The second line contains N space-separated words.',
    output_format: 'Print unique words and counts in alphabetical order.',
    constraints_text: '1 <= N <= 1000',
    explanation: 'In "apple banana apple", apple occurs 2 times, banana occurs 1 time.',
    samples: [
      { sample_input: '3\napple banana apple\n', expected_output: 'apple 2\nbanana 1\n', explanation: 'Alphabetical word frequencies' }
    ],
    test_cases: [
      { test_input: '3\napple banana apple\n', expected_output: 'apple 2\nbanana 1\n', is_hidden: false },
      { test_input: '4\nz y x w\n', expected_output: 'w 1\nx 1\ny 1\nz 1\n', is_hidden: true },
      { test_input: '1\ncode\n', expected_output: 'code 1\n', is_hidden: true }
    ],
    starter_code: `#include <iostream>
#include <string>
#include <map>

int main() {
    int n;
    if (std::cin >> n) {
        std::map<std::string, int> freq;
        for (int i = 0; i < n; i++) {
            std::string word;
            std::cin >> word;
            freq[word]++;
        }
        for (const auto &p : freq) {
            std::cout << p.first << " " << p.second << "\\n";
        }
    }
    return 0;
}
`
  },
  {
    languageSlug: 'cpp',
    levelNumber: 6,
    title: 'Distinct Elements Count with std::set',
    statement: 'Given N integers, use std::set to determine and print the total number of distinct unique integers.',
    input_format: 'The first line contains N. The second line contains N integers.',
    output_format: 'Print the count of distinct elements.',
    constraints_text: '1 <= N <= 10000, -10^6 <= A[i] <= 10^6',
    explanation: 'In [5, 2, 5, 8, 2], distinct elements are 2, 5, 8 (3 distinct elements).',
    samples: [
      { sample_input: '5\n5 2 5 8 2\n', expected_output: '3\n', explanation: 'Distinct count is 3' }
    ],
    test_cases: [
      { test_input: '5\n5 2 5 8 2\n', expected_output: '3\n', is_hidden: false },
      { test_input: '4\n1 2 3 4\n', expected_output: '4\n', is_hidden: true },
      { test_input: '3\n7 7 7\n', expected_output: '1\n', is_hidden: true }
    ],
    starter_code: `#include <iostream>
#include <set>

int main() {
    int n;
    if (std::cin >> n) {
        std::set<int> s;
        for (int i = 0; i < n; i++) {
            int x;
            std::cin >> x;
            s.insert(x);
        }
        std::cout << s.size() << std::endl;
    }
    return 0;
}
`
  },
  {
    languageSlug: 'cpp',
    levelNumber: 6,
    title: 'Balanced Parentheses with std::stack',
    statement: 'Given a string containing only parentheses \'(\' and \')\', use std::stack to check if it is balanced. Print "BALANCED" or "UNBALANCED".',
    input_format: 'A string of parentheses.',
    output_format: 'Print "BALANCED" or "UNBALANCED".',
    constraints_text: '1 <= length <= 1000',
    explanation: '"(())" is balanced. "())(" is unbalanced.',
    samples: [
      { sample_input: '(())()\n', expected_output: 'BALANCED\n', explanation: 'All opened brackets are properly closed' },
      { sample_input: '())(\n', expected_output: 'UNBALANCED\n', explanation: 'Mismatched order' }
    ],
    test_cases: [
      { test_input: '(())()\n', expected_output: 'BALANCED\n', is_hidden: false },
      { test_input: '())(\n', expected_output: 'UNBALANCED\n', is_hidden: false },
      { test_input: '(\n', expected_output: 'UNBALANCED\n', is_hidden: true },
      { test_input: '((()))\n', expected_output: 'BALANCED\n', is_hidden: true }
    ],
    starter_code: `#include <iostream>
#include <string>
#include <stack>

int main() {
    std::string s;
    if (std::cin >> s) {
        std::stack<char> st;
        bool ok = true;
        for (char c : s) {
            if (c == '(') st.push(c);
            else {
                if (st.empty()) {
                    ok = false;
                    break;
                }
                st.pop();
            }
        }
        if (ok && st.empty()) std::cout << "BALANCED\\n";
        else std::cout << "UNBALANCED\\n";
    }
    return 0;
}
`
  },
  {
    languageSlug: 'cpp',
    levelNumber: 6,
    title: 'Sort Pairs by Score',
    statement: 'Given N student records with name and score, sort the students by score in descending order. If scores are tied, sort alphabetically by name. Print each student as "<name> <score>" on a new line.',
    input_format: 'First line contains N. The next N lines contain a name string and integer score.',
    output_format: 'Print sorted records, one per line.',
    constraints_text: '1 <= N <= 100',
    explanation: 'Higher scores come first; ties sorted alphabetically.',
    samples: [
      { sample_input: '3\nBob 85\nAlice 92\nCharlie 85\n', expected_output: 'Alice 92\nBob 85\nCharlie 85\n', explanation: 'Alice 92, then Bob and Charlie tied at 85' }
    ],
    test_cases: [
      { test_input: '3\nBob 85\nAlice 92\nCharlie 85\n', expected_output: 'Alice 92\nBob 85\nCharlie 85\n', is_hidden: false },
      { test_input: '2\nZoe 50\nAdam 100\n', expected_output: 'Adam 100\nZoe 50\n', is_hidden: true },
      { test_input: '1\nSingle 77\n', expected_output: 'Single 77\n', is_hidden: true }
    ],
    starter_code: `#include <iostream>
#include <string>
#include <vector>
#include <algorithm>

struct Student {
    std::string name;
    int score;
};

int main() {
    int n;
    if (std::cin >> n) {
        std::vector<Student> v(n);
        for (int i = 0; i < n; i++) {
            std::cin >> v[i].name >> v[i].score;
        }
        std::sort(v.begin(), v.end(), [](const Student &a, const Student &b) {
            if (a.score != b.score) return a.score > b.score;
            return a.name < b.name;
        });
        for (const auto &s : v) {
            std::cout << s.name << " " << s.score << "\\n";
        }
    }
    return 0;
}
`
  }
];

module.exports = cppQuestions;
