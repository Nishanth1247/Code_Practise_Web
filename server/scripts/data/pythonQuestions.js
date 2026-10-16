/**
 * Seed questions for Python track (6 levels x 5 questions = 30 questions)
 * Curriculum:
 * Level 1: Variables & Input
 * Level 2: Conditional Flow
 * Level 3: Loops & Sequences
 * Level 4: Lists & Strings
 * Level 5: Functions & Modules
 * Level 6: Dictionaries & Sets
 */

const pythonQuestions = [
  // =========================================================================
  // LEVEL 1: Variables & Input
  // =========================================================================
  {
    languageSlug: 'python',
    levelNumber: 1,
    title: 'Multiply by Nine',
    statement: 'Given an integer N, compute and print the value of N multiplied by 9.',
    input_format: 'A single integer N.',
    output_format: 'Print N * 9 on a single line.',
    constraints_text: '-10^6 <= N <= 10^6',
    explanation: 'For N = 7, 7 * 9 = 63.',
    samples: [
      { sample_input: '7\n', expected_output: '63\n', explanation: '7 * 9 = 63' }
    ],
    test_cases: [
      { test_input: '7\n', expected_output: '63\n', is_hidden: false },
      { test_input: '0\n', expected_output: '0\n', is_hidden: true },
      { test_input: '-5\n', expected_output: '-45\n', is_hidden: true },
      { test_input: '1111\n', expected_output: '9999\n', is_hidden: true }
    ],
    starter_code: `import sys

def main():
    line = sys.stdin.read().strip()
    if line:
        n = int(line)
        print(n * 9)

if __name__ == '__main__':
    main()
`
  },
  {
    languageSlug: 'python',
    levelNumber: 1,
    title: 'String Repeat Line',
    statement: 'Given a word W and an integer K, print the word repeated K times separated by spaces on a single line.',
    input_format: 'First line contains word W. Second line contains integer K.',
    output_format: 'Print the word repeated K times with spaces.',
    constraints_text: '1 <= length(W) <= 20, 1 <= K <= 50',
    explanation: '"Echo" repeated 3 times is "Echo Echo Echo".',
    samples: [
      { sample_input: 'Echo\n3\n', expected_output: 'Echo Echo Echo\n', explanation: 'Repeated 3 times' }
    ],
    test_cases: [
      { test_input: 'Echo\n3\n', expected_output: 'Echo Echo Echo\n', is_hidden: false },
      { test_input: 'Hi\n1\n', expected_output: 'Hi\n', is_hidden: true },
      { test_input: 'Python\n4\n', expected_output: 'Python Python Python Python\n', is_hidden: true }
    ],
    starter_code: `import sys

def main():
    tokens = sys.stdin.read().split()
    if len(tokens) >= 2:
        w = tokens[0]
        k = int(tokens[1])
        print(" ".join([w] * k))

if __name__ == '__main__':
    main()
`
  },
  {
    languageSlug: 'python',
    levelNumber: 1,
    title: 'Hours to Minutes Conversion',
    statement: 'Given an integer number of hours H, calculate and print the total number of minutes (H * 60).',
    input_format: 'A single integer H.',
    output_format: 'Print the total minutes.',
    constraints_text: '0 <= H <= 10000',
    explanation: '4 hours = 4 * 60 = 240 minutes.',
    samples: [
      { sample_input: '4\n', expected_output: '240\n', explanation: '4 * 60 = 240' }
    ],
    test_cases: [
      { test_input: '4\n', expected_output: '240\n', is_hidden: false },
      { test_input: '0\n', expected_output: '0\n', is_hidden: true },
      { test_input: '24\n', expected_output: '1440\n', is_hidden: true }
    ],
    starter_code: `import sys

def main():
    line = sys.stdin.read().strip()
    if line:
        h = int(line)
        print(h * 60)

if __name__ == '__main__':
    main()
`
  },
  {
    languageSlug: 'python',
    levelNumber: 1,
    title: 'Difference Between Two Numbers',
    statement: 'Given two integers A and B, print their arithmetic difference A - B.',
    input_format: 'Two space-separated integers A and B.',
    output_format: 'Print A - B.',
    constraints_text: '-10^6 <= A, B <= 10^6',
    explanation: '15 - 8 = 7.',
    samples: [
      { sample_input: '15 8\n', expected_output: '7\n', explanation: '15 - 8 = 7' }
    ],
    test_cases: [
      { test_input: '15 8\n', expected_output: '7\n', is_hidden: false },
      { test_input: '10 20\n', expected_output: '-10\n', is_hidden: true },
      { test_input: '-5 -5\n', expected_output: '0\n', is_hidden: true }
    ],
    starter_code: `import sys

def main():
    tokens = sys.stdin.read().split()
    if len(tokens) >= 2:
        a = int(tokens[0])
        b = int(tokens[1])
        print(a - b)

if __name__ == '__main__':
    main()
`
  },
  {
    languageSlug: 'python',
    levelNumber: 1,
    title: 'Integer Division and Remainder',
    statement: 'Given two positive integers A and B, print the integer floor division A // B and the remainder A % B separated by a space.',
    input_format: 'Two space-separated integers A and B.',
    output_format: 'Print "A//B A%B".',
    constraints_text: '1 <= A, B <= 10^9',
    explanation: '25 // 4 = 6 and 25 % 4 = 1.',
    samples: [
      { sample_input: '25 4\n', expected_output: '6 1\n', explanation: '25 // 4 = 6, 25 % 4 = 1' }
    ],
    test_cases: [
      { test_input: '25 4\n', expected_output: '6 1\n', is_hidden: false },
      { test_input: '10 5\n', expected_output: '2 0\n', is_hidden: true },
      { test_input: '3 8\n', expected_output: '0 3\n', is_hidden: true }
    ],
    starter_code: `import sys

def main():
    tokens = sys.stdin.read().split()
    if len(tokens) >= 2:
        a = int(tokens[0])
        b = int(tokens[1])
        print(f"{a // b} {a % b}")

if __name__ == '__main__':
    main()
`
  },

  // =========================================================================
  // LEVEL 2: Conditional Flow
  // =========================================================================
  {
    languageSlug: 'python',
    levelNumber: 2,
    title: 'Sign and Parity Classifier',
    statement: 'Given an integer N, output its classification: "POSITIVE EVEN", "POSITIVE ODD", "NEGATIVE EVEN", "NEGATIVE ODD", or "ZERO".',
    input_format: 'A single integer N.',
    output_format: 'Print the classification string.',
    constraints_text: '-10^6 <= N <= 10^6',
    explanation: '8 is positive and even -> "POSITIVE EVEN". -3 is negative and odd -> "NEGATIVE ODD".',
    samples: [
      { sample_input: '8\n', expected_output: 'POSITIVE EVEN\n', explanation: 'Positive and even' },
      { sample_input: '-3\n', expected_output: 'NEGATIVE ODD\n', explanation: 'Negative and odd' }
    ],
    test_cases: [
      { test_input: '8\n', expected_output: 'POSITIVE EVEN\n', is_hidden: false },
      { test_input: '-3\n', expected_output: 'NEGATIVE ODD\n', is_hidden: false },
      { test_input: '0\n', expected_output: 'ZERO\n', is_hidden: true },
      { test_input: '5\n', expected_output: 'POSITIVE ODD\n', is_hidden: true },
      { test_input: '-4\n', expected_output: 'NEGATIVE EVEN\n', is_hidden: true }
    ],
    starter_code: `import sys

def main():
    line = sys.stdin.read().strip()
    if line:
        n = int(line)
        if n == 0:
            print("ZERO")
        elif n > 0:
            print("POSITIVE EVEN" if n % 2 == 0 else "POSITIVE ODD")
        else:
            print("NEGATIVE EVEN" if n % 2 == 0 else "NEGATIVE ODD")

if __name__ == '__main__':
    main()
`
  },
  {
    languageSlug: 'python',
    levelNumber: 2,
    title: 'Exam Pass or Fail Status',
    statement: 'Given an exam score M (0 <= M <= 100), print "PASS" if M >= 40, or "FAIL" if M < 40.',
    input_format: 'A single integer M.',
    output_format: 'Print "PASS" or "FAIL".',
    constraints_text: '0 <= M <= 100',
    explanation: 'Score 55 is >= 40, so PASS. Score 35 is < 40, so FAIL.',
    samples: [
      { sample_input: '55\n', expected_output: 'PASS\n', explanation: '55 >= 40' },
      { sample_input: '35\n', expected_output: 'FAIL\n', explanation: '35 < 40' }
    ],
    test_cases: [
      { test_input: '55\n', expected_output: 'PASS\n', is_hidden: false },
      { test_input: '35\n', expected_output: 'FAIL\n', is_hidden: false },
      { test_input: '40\n', expected_output: 'PASS\n', is_hidden: true },
      { test_input: '0\n', expected_output: 'FAIL\n', is_hidden: true },
      { test_input: '100\n', expected_output: 'PASS\n', is_hidden: true }
    ],
    starter_code: `import sys

def main():
    line = sys.stdin.read().strip()
    if line:
        m = int(line)
        print("PASS" if m >= 40 else "FAIL")

if __name__ == '__main__':
    main()
`
  },
  {
    languageSlug: 'python',
    levelNumber: 2,
    title: 'Tax Slab Rate Finder',
    statement: 'Given annual income I, print the tax rate percentage: 0 for I <= 250000, 5 for 250000 < I <= 500000, 10 for 500000 < I <= 1000000, and 20 for I > 1000000.',
    input_format: 'A single integer I.',
    output_format: 'Print the tax percentage (0, 5, 10, or 20).',
    constraints_text: '0 <= I <= 10^8',
    explanation: 'Income 400000 falls in 250000-500000 slab -> 5.',
    samples: [
      { sample_input: '400000\n', expected_output: '5\n', explanation: '5% slab' },
      { sample_input: '200000\n', expected_output: '0\n', explanation: '0% slab' }
    ],
    test_cases: [
      { test_input: '400000\n', expected_output: '5\n', is_hidden: false },
      { test_input: '200000\n', expected_output: '0\n', is_hidden: false },
      { test_input: '750000\n', expected_output: '10\n', is_hidden: true },
      { test_input: '1500000\n', expected_output: '20\n', is_hidden: true }
    ],
    starter_code: `import sys

def main():
    line = sys.stdin.read().strip()
    if line:
        income = int(line)
        if income <= 250000:
            print(0)
        elif income <= 500000:
            print(5)
        elif income <= 1000000:
            print(10)
        else:
            print(20)

if __name__ == '__main__':
    main()
`
  },
  {
    languageSlug: 'python',
    levelNumber: 2,
    title: 'Check Century Year',
    statement: 'Given a year Y, determine if it is a century year (i.e. perfectly divisible by 100). Print "CENTURY" or "NOT CENTURY".',
    input_format: 'A single integer Y.',
    output_format: 'Print "CENTURY" or "NOT CENTURY".',
    constraints_text: '1 <= Y <= 9999',
    explanation: '1900 and 2000 end in 00 so CENTURY. 2024 is NOT CENTURY.',
    samples: [
      { sample_input: '1900\n', expected_output: 'CENTURY\n', explanation: 'Divisible by 100' },
      { sample_input: '2024\n', expected_output: 'NOT CENTURY\n', explanation: 'Not divisible by 100' }
    ],
    test_cases: [
      { test_input: '1900\n', expected_output: 'CENTURY\n', is_hidden: false },
      { test_input: '2024\n', expected_output: 'NOT CENTURY\n', is_hidden: false },
      { test_input: '2000\n', expected_output: 'CENTURY\n', is_hidden: true },
      { test_input: '100\n', expected_output: 'CENTURY\n', is_hidden: true }
    ],
    starter_code: `import sys

def main():
    line = sys.stdin.read().strip()
    if line:
        y = int(line)
        print("CENTURY" if y % 100 == 0 else "NOT CENTURY")

if __name__ == '__main__':
    main()
`
  },
  {
    languageSlug: 'python',
    levelNumber: 2,
    title: 'Speed Limit Compliance',
    statement: 'Given vehicle speed S and speed limit L: print "OK" if S <= L; print "WARNING" if L < S <= L + 20; print "FINE" if S > L + 20.',
    input_format: 'Two space-separated integers S and L.',
    output_format: 'Print "OK", "WARNING", or "FINE".',
    constraints_text: '1 <= S, L <= 200',
    explanation: 'Speed 70 in limit 60 gives WARNING. Speed 90 in limit 60 gives FINE.',
    samples: [
      { sample_input: '70 60\n', expected_output: 'WARNING\n', explanation: 'Over speed limit by 10' },
      { sample_input: '55 60\n', expected_output: 'OK\n', explanation: 'Within limit' }
    ],
    test_cases: [
      { test_input: '70 60\n', expected_output: 'WARNING\n', is_hidden: false },
      { test_input: '55 60\n', expected_output: 'OK\n', is_hidden: false },
      { test_input: '90 60\n', expected_output: 'FINE\n', is_hidden: true },
      { test_input: '80 60\n', expected_output: 'WARNING\n', is_hidden: true }
    ],
    starter_code: `import sys

def main():
    tokens = sys.stdin.read().split()
    if len(tokens) >= 2:
        s = int(tokens[0])
        l = int(tokens[1])
        if s <= l:
            print("OK")
        elif s <= l + 20:
            print("WARNING")
        else:
            print("FINE")

if __name__ == '__main__':
    main()
`
  },

  // =========================================================================
  // LEVEL 3: Loops & Sequences
  // =========================================================================
  {
    languageSlug: 'python',
    levelNumber: 3,
    title: 'Sum of Multiples of 3 or 5',
    statement: 'Given a positive integer N, compute the sum of all natural numbers strictly less than N that are divisible by 3 or 5.',
    input_format: 'A single integer N.',
    output_format: 'Print the total sum.',
    constraints_text: '1 <= N <= 10^5',
    explanation: 'For N = 10, multiples below 10 are 3, 5, 6, 9. Sum = 23.',
    samples: [
      { sample_input: '10\n', expected_output: '23\n', explanation: '3 + 5 + 6 + 9 = 23' }
    ],
    test_cases: [
      { test_input: '10\n', expected_output: '23\n', is_hidden: false },
      { test_input: '16\n', expected_output: '60\n', is_hidden: true },
      { test_input: '1\n', expected_output: '0\n', is_hidden: true },
      { test_input: '100\n', expected_output: '2318\n', is_hidden: true }
    ],
    starter_code: `import sys

def main():
    line = sys.stdin.read().strip()
    if line:
        n = int(line)
        total = sum(i for i in range(1, n) if i % 3 == 0 or i % 5 == 0)
        print(total)

if __name__ == '__main__':
    main()
`
  },
  {
    languageSlug: 'python',
    levelNumber: 3,
    title: 'Find Factorial Product',
    statement: 'Given an integer N between 0 and 12, compute N! using a loop. (0! = 1).',
    input_format: 'A single integer N.',
    output_format: 'Print N! on a single line.',
    constraints_text: '0 <= N <= 12',
    explanation: '6! = 6 * 5 * 4 * 3 * 2 * 1 = 720.',
    samples: [
      { sample_input: '6\n', expected_output: '720\n', explanation: '6! = 720' }
    ],
    test_cases: [
      { test_input: '6\n', expected_output: '720\n', is_hidden: false },
      { test_input: '0\n', expected_output: '1\n', is_hidden: true },
      { test_input: '1\n', expected_output: '1\n', is_hidden: true },
      { test_input: '7\n', expected_output: '5040\n', is_hidden: true }
    ],
    starter_code: `import sys

def main():
    line = sys.stdin.read().strip()
    if line:
        n = int(line)
        fact = 1
        for i in range(1, n + 1):
            fact *= i
        print(fact)

if __name__ == '__main__':
    main()
`
  },
  {
    languageSlug: 'python',
    levelNumber: 3,
    title: 'Count Vowels and Consonants in Word',
    statement: 'Given a lowercase string containing only English letters, count the total vowels (a, e, i, o, u) and consonants. Print them separated by a space: "<vowels> <consonants>".',
    input_format: 'A single word string.',
    output_format: 'Print "<vowels> <consonants>".',
    constraints_text: '1 <= length <= 100',
    explanation: 'In "python", vowels=2 (o, y isn\'t in standard a,e,i,o,u), so 1 vowel (o) and 5 consonants.',
    samples: [
      { sample_input: 'python\n', expected_output: '1 5\n', explanation: '1 vowel (o), 5 consonants' }
    ],
    test_cases: [
      { test_input: 'python\n', expected_output: '1 5\n', is_hidden: false },
      { test_input: 'aeiou\n', expected_output: '5 0\n', is_hidden: true },
      { test_input: 'bcd\n', expected_output: '0 3\n', is_hidden: true }
    ],
    starter_code: `import sys

def main():
    s = sys.stdin.read().strip().lower()
    if s:
        vowels = set('aeiou')
        v_count = sum(1 for c in s if c in vowels)
        c_count = sum(1 for c in s if c.isalpha() and c not in vowels)
        print(f"{v_count} {c_count}")

if __name__ == '__main__':
    main()
`
  },
  {
    languageSlug: 'python',
    levelNumber: 3,
    title: 'Print Sequential Number Pyramid',
    statement: 'Given an integer N (1 <= N <= 9), print a pyramid where the i-th line contains numbers 1 through i separated by spaces.',
    input_format: 'A single integer N.',
    output_format: 'Print N lines with numbers.',
    constraints_text: '1 <= N <= 9',
    explanation: 'For N = 3:\n1\n1 2\n1 2 3',
    samples: [
      { sample_input: '3\n', expected_output: '1\n1 2\n1 2 3\n', explanation: 'Pyramid up to 3' }
    ],
    test_cases: [
      { test_input: '3\n', expected_output: '1\n1 2\n1 2 3\n', is_hidden: false },
      { test_input: '1\n', expected_output: '1\n', is_hidden: true },
      { test_input: '4\n', expected_output: '1\n1 2\n1 2 3\n1 2 3 4\n', is_hidden: true }
    ],
    starter_code: `import sys

def main():
    line = sys.stdin.read().strip()
    if line:
        n = int(line)
        for i in range(1, n + 1):
            print(" ".join(str(x) for x in range(1, i + 1)))

if __name__ == '__main__':
    main()
`
  },
  {
    languageSlug: 'python',
    levelNumber: 3,
    title: 'Check Prime with Loop',
    statement: 'Given an integer N > 1, determine if N is prime using a loop. Print "PRIME" or "COMPOSITE".',
    input_format: 'A single integer N.',
    output_format: 'Print "PRIME" or "COMPOSITE".',
    constraints_text: '2 <= N <= 10^7',
    explanation: '13 is divisible only by 1 and 13 -> PRIME. 15 is divisible by 3 and 5 -> COMPOSITE.',
    samples: [
      { sample_input: '13\n', expected_output: 'PRIME\n', explanation: '13 is prime' },
      { sample_input: '15\n', expected_output: 'COMPOSITE\n', explanation: '15 is composite' }
    ],
    test_cases: [
      { test_input: '13\n', expected_output: 'PRIME\n', is_hidden: false },
      { test_input: '15\n', expected_output: 'COMPOSITE\n', is_hidden: false },
      { test_input: '2\n', expected_output: 'PRIME\n', is_hidden: true },
      { test_input: '97\n', expected_output: 'PRIME\n', is_hidden: true },
      { test_input: '100\n', expected_output: 'COMPOSITE\n', is_hidden: true }
    ],
    starter_code: `import sys

def main():
    line = sys.stdin.read().strip()
    if line:
        n = int(line)
        is_prime = True
        i = 2
        while i * i <= n:
            if n % i == 0:
                is_prime = False
                break
            i += 1
        print("PRIME" if is_prime else "COMPOSITE")

if __name__ == '__main__':
    main()
`
  },

  // =========================================================================
  // LEVEL 4: Lists & Strings
  // =========================================================================
  {
    languageSlug: 'python',
    levelNumber: 4,
    title: 'Filter Even Numbers in List',
    statement: 'Given a list of space-separated integers, filter and print all even numbers in their original order separated by spaces. If there are no even numbers, print "NONE".',
    input_format: 'A single line containing space-separated integers.',
    output_format: 'Print even integers space-separated or "NONE".',
    constraints_text: '1 <= elements <= 1000',
    explanation: 'From [1, 4, 7, 8, 10], even numbers are 4 8 10.',
    samples: [
      { sample_input: '1 4 7 8 10\n', expected_output: '4 8 10\n', explanation: '4, 8, 10 are even' },
      { sample_input: '1 3 5\n', expected_output: 'NONE\n', explanation: 'No even numbers' }
    ],
    test_cases: [
      { test_input: '1 4 7 8 10\n', expected_output: '4 8 10\n', is_hidden: false },
      { test_input: '1 3 5\n', expected_output: 'NONE\n', is_hidden: false },
      { test_input: '2\n', expected_output: '2\n', is_hidden: true },
      { test_input: '0 10 20\n', expected_output: '0 10 20\n', is_hidden: true }
    ],
    starter_code: `import sys

def main():
    nums = [int(x) for x in sys.stdin.read().split()]
    evens = [x for x in nums if x % 2 == 0]
    if evens:
        print(" ".join(str(x) for x in evens))
    else:
        print("NONE")

if __name__ == '__main__':
    main()
`
  },
  {
    languageSlug: 'python',
    levelNumber: 4,
    title: 'Capitalize Every Word',
    statement: 'Given a sentence string with space-separated words, capitalize the first letter of each word and print the result.',
    input_format: 'A line of text.',
    output_format: 'Print the sentence with capitalized words.',
    constraints_text: '1 <= length <= 200',
    explanation: '"welcome to python coding" -> "Welcome To Python Coding".',
    samples: [
      { sample_input: 'welcome to python coding\n', expected_output: 'Welcome To Python Coding\n', explanation: 'Capitalized first letter of each word' }
    ],
    test_cases: [
      { test_input: 'welcome to python coding\n', expected_output: 'Welcome To Python Coding\n', is_hidden: false },
      { test_input: 'hello world\n', expected_output: 'Hello World\n', is_hidden: true },
      { test_input: 'a b c\n', expected_output: 'A B C\n', is_hidden: true }
    ],
    starter_code: `import sys

def main():
    words = sys.stdin.read().split()
    if words:
        capitalized = [w.capitalize() for w in words]
        print(" ".join(capitalized))

if __name__ == '__main__':
    main()
`
  },
  {
    languageSlug: 'python',
    levelNumber: 4,
    title: 'Reverse List Order',
    statement: 'Given a line of space-separated integers, reverse the entire list and print the reversed elements separated by spaces.',
    input_format: 'A line of space-separated integers.',
    output_format: 'Print reversed integers space-separated.',
    constraints_text: '1 <= elements <= 1000',
    explanation: 'Input [10, 20, 30] reversed is 30 20 10.',
    samples: [
      { sample_input: '10 20 30\n', expected_output: '30 20 10\n', explanation: 'Reversed order' }
    ],
    test_cases: [
      { test_input: '10 20 30\n', expected_output: '30 20 10\n', is_hidden: false },
      { test_input: '1\n', expected_output: '1\n', is_hidden: true },
      { test_input: '5 4 3 2 1\n', expected_output: '1 2 3 4 5\n', is_hidden: true }
    ],
    starter_code: `import sys

def main():
    tokens = sys.stdin.read().split()
    if tokens:
        tokens.reverse()
        print(" ".join(tokens))

if __name__ == '__main__':
    main()
`
  },
  {
    languageSlug: 'python',
    levelNumber: 4,
    title: 'List Difference (A minus B)',
    statement: 'Given two lines of space-separated integers representing lists A and B, find all elements in A that do not appear in B. Print them in sorted unique order separated by spaces, or "EMPTY" if none.',
    input_format: 'First line contains integers of list A. Second line contains integers of list B.',
    output_format: 'Print sorted unique elements or "EMPTY".',
    constraints_text: '1 <= elements <= 1000',
    explanation: 'A = [1, 2, 3, 4], B = [3, 4, 5]. Difference is 1 2.',
    samples: [
      { sample_input: '1 2 3 4\n3 4 5\n', expected_output: '1 2\n', explanation: 'Elements in A not in B' }
    ],
    test_cases: [
      { test_input: '1 2 3 4\n3 4 5\n', expected_output: '1 2\n', is_hidden: false },
      { test_input: '1 2\n1 2 3\n', expected_output: 'EMPTY\n', is_hidden: true },
      { test_input: '5 10 15\n2 4 6\n', expected_output: '5 10 15\n', is_hidden: true }
    ],
    starter_code: `import sys

def main():
    lines = sys.stdin.read().strip().split('\\n')
    if len(lines) >= 2:
        a = set(int(x) for x in lines[0].split())
        b = set(int(x) for x in lines[1].split())
        diff = sorted(list(a - b))
        if diff:
            print(" ".join(str(x) for x in diff))
        else:
            print("EMPTY")

if __name__ == '__main__':
    main()
`
  },
  {
    languageSlug: 'python',
    levelNumber: 4,
    title: 'Pangram Sentence Checker',
    statement: 'A pangram is a sentence containing every letter of the English alphabet at least once. Given a sentence string, print "YES" if it is a pangram, or "NO" otherwise.',
    input_format: 'A line of text.',
    output_format: 'Print "YES" or "NO".',
    constraints_text: '1 <= length <= 500',
    explanation: '"The quick brown fox jumps over the lazy dog" contains all 26 letters -> YES.',
    samples: [
      { sample_input: 'The quick brown fox jumps over the lazy dog\n', expected_output: 'YES\n', explanation: 'Contains all 26 letters' },
      { sample_input: 'Hello world\n', expected_output: 'NO\n', explanation: 'Missing most letters' }
    ],
    test_cases: [
      { test_input: 'The quick brown fox jumps over the lazy dog\n', expected_output: 'YES\n', is_hidden: false },
      { test_input: 'Hello world\n', expected_output: 'NO\n', is_hidden: false },
      { test_input: 'Pack my box with five dozen liquor jugs\n', expected_output: 'YES\n', is_hidden: true },
      { test_input: 'abcdefghijklmnopqrstuvwxyz\n', expected_output: 'YES\n', is_hidden: true }
    ],
    starter_code: `import sys
import string

def main():
    text = sys.stdin.read().lower()
    letters = set(c for c in text if c.isalpha())
    if len(letters) == 26:
        print("YES")
    else:
        print("NO")

if __name__ == '__main__':
    main()
`
  },

  // =========================================================================
  // LEVEL 5: Functions & Modules
  // =========================================================================
  {
    languageSlug: 'python',
    levelNumber: 5,
    title: 'Compute GCD and LCM Pair',
    statement: 'Write functions to compute the Greatest Common Divisor (GCD) and Least Common Multiple (LCM) of two integers A and B. Print them separated by a space: "<gcd> <lcm>".',
    input_format: 'Two space-separated integers A and B.',
    output_format: 'Print "<gcd> <lcm>".',
    constraints_text: '1 <= A, B <= 10^9',
    explanation: 'For 12 and 18: GCD is 6, LCM is 36.',
    samples: [
      { sample_input: '12 18\n', expected_output: '6 36\n', explanation: 'GCD=6, LCM=36' }
    ],
    test_cases: [
      { test_input: '12 18\n', expected_output: '6 36\n', is_hidden: false },
      { test_input: '5 7\n', expected_output: '1 35\n', is_hidden: true },
      { test_input: '20 20\n', expected_output: '20 20\n', is_hidden: true }
    ],
    starter_code: `import sys
import math

def main():
    tokens = sys.stdin.read().split()
    if len(tokens) >= 2:
        a = int(tokens[0])
        b = int(tokens[1])
        g = math.gcd(a, b)
        l = (a * b) // g
        print(f"{g} {l}")

if __name__ == '__main__':
    main()
`
  },
  {
    languageSlug: 'python',
    levelNumber: 5,
    title: 'Recursive Vowel Counter',
    statement: 'Define a recursive function count_vowels(s) that counts the vowels in string s. Print the count.',
    input_format: 'A single word string.',
    output_format: 'Print the count of vowels.',
    constraints_text: '1 <= length <= 100',
    explanation: 'In "education", vowels are e, u, a, i, o (5 vowels).',
    samples: [
      { sample_input: 'education\n', expected_output: '5\n', explanation: '5 vowels' }
    ],
    test_cases: [
      { test_input: 'education\n', expected_output: '5\n', is_hidden: false },
      { test_input: 'sky\n', expected_output: '0\n', is_hidden: true },
      { test_input: 'ai\n', expected_output: '2\n', is_hidden: true }
    ],
    starter_code: `import sys

def count_vowels(s):
    if not s:
        return 0
    return (1 if s[0].lower() in 'aeiou' else 0) + count_vowels(s[1:])

def main():
    word = sys.stdin.read().strip()
    if word:
        print(count_vowels(word))

if __name__ == '__main__':
    main()
`
  },
  {
    languageSlug: 'python',
    levelNumber: 5,
    title: 'Generate Fibonacci Sequence List',
    statement: 'Write a generator or function that produces the first N numbers of the Fibonacci sequence starting with 0, 1. Print them space-separated on one line.',
    input_format: 'A single integer N.',
    output_format: 'Print the first N Fibonacci numbers separated by spaces.',
    constraints_text: '1 <= N <= 30',
    explanation: 'For N = 6, sequence is 0 1 1 2 3 5.',
    samples: [
      { sample_input: '6\n', expected_output: '0 1 1 2 3 5\n', explanation: 'First 6 terms' }
    ],
    test_cases: [
      { test_input: '6\n', expected_output: '0 1 1 2 3 5\n', is_hidden: false },
      { test_input: '1\n', expected_output: '0\n', is_hidden: true },
      { test_input: '2\n', expected_output: '0 1\n', is_hidden: true },
      { test_input: '8\n', expected_output: '0 1 1 2 3 5 8 13\n', is_hidden: true }
    ],
    starter_code: `import sys

def fib_list(n):
    if n == 1:
        return [0]
    res = [0, 1]
    while len(res) < n:
        res.append(res[-1] + res[-2])
    return res

def main():
    line = sys.stdin.read().strip()
    if line:
        n = int(line)
        print(" ".join(str(x) for x in fib_list(n)))

if __name__ == '__main__':
    main()
`
  },
  {
    languageSlug: 'python',
    levelNumber: 5,
    title: 'Sort Words by Length and Alphabet',
    statement: 'Given a list of words, sort them primarily by their length in ascending order. For words with equal length, sort them alphabetically. Print the sorted words space-separated.',
    input_format: 'A line of space-separated words.',
    output_format: 'Print sorted words space-separated.',
    constraints_text: '1 <= words <= 100',
    explanation: '["apple", "pie", "cat"] sorted by length -> "cat pie apple".',
    samples: [
      { sample_input: 'apple pie cat\n', expected_output: 'cat pie apple\n', explanation: 'cat, pie have length 3; apple length 5' }
    ],
    test_cases: [
      { test_input: 'apple pie cat\n', expected_output: 'cat pie apple\n', is_hidden: false },
      { test_input: 'banana a or\n', expected_output: 'a or banana\n', is_hidden: true },
      { test_input: 'z y x\n', expected_output: 'x y z\n', is_hidden: true }
    ],
    starter_code: `import sys

def main():
    words = sys.stdin.read().split()
    if words:
        words.sort(key=lambda w: (len(w), w))
        print(" ".join(words))

if __name__ == '__main__':
    main()
`
  },
  {
    languageSlug: 'python',
    levelNumber: 5,
    title: 'Cumulative Sum List Function',
    statement: 'Write a function cumulative_sum(nums) that computes the running total of a list of integers. Print the cumulative list space-separated.',
    input_format: 'A line of space-separated integers.',
    output_format: 'Print the cumulative sum list.',
    constraints_text: '1 <= elements <= 1000',
    explanation: '[1, 2, 3, 4] -> [1, 3, 6, 10].',
    samples: [
      { sample_input: '1 2 3 4\n', expected_output: '1 3 6 10\n', explanation: 'Cumulative sums' }
    ],
    test_cases: [
      { test_input: '1 2 3 4\n', expected_output: '1 3 6 10\n', is_hidden: false },
      { test_input: '5 5 5\n', expected_output: '5 10 15\n', is_hidden: true },
      { test_input: '10 -2 3\n', expected_output: '10 8 11\n', is_hidden: true }
    ],
    starter_code: `import sys

def cumulative_sum(nums):
    res = []
    total = 0
    for x in nums:
        total += x
        res.append(total)
    return res

def main():
    nums = [int(x) for x in sys.stdin.read().split()]
    if nums:
        print(" ".join(str(x) for x in cumulative_sum(nums)))

if __name__ == '__main__':
    main()
`
  },

  // =========================================================================
  // LEVEL 6: Dictionaries & Sets
  // =========================================================================
  {
    languageSlug: 'python',
    levelNumber: 6,
    title: 'Character Frequency Order in String',
    statement: 'Given a word, count the occurrences of each character using a dictionary. Print each character and its count in the order of first appearance formatted as "char:count" space-separated.',
    input_format: 'A single word string.',
    output_format: 'Print "char:count" pairs separated by spaces.',
    constraints_text: '1 <= length <= 200',
    explanation: 'In "banana", \'b\' appears 1, \'a\' appears 3, \'n\' appears 2 -> b:1 a:3 n:2.',
    samples: [
      { sample_input: 'banana\n', expected_output: 'b:1 a:3 n:2\n', explanation: 'Frequencies in order of first appearance' }
    ],
    test_cases: [
      { test_input: 'banana\n', expected_output: 'b:1 a:3 n:2\n', is_hidden: false },
      { test_input: 'hello\n', expected_output: 'h:1 e:1 l:2 o:1\n', is_hidden: true },
      { test_input: 'aaaaa\n', expected_output: 'a:5\n', is_hidden: true }
    ],
    starter_code: `import sys

def main():
    word = sys.stdin.read().strip()
    if word:
        counts = {}
        for c in word:
            counts[c] = counts.get(c, 0) + 1
        print(" ".join(f"{c}:{cnt}" for c, cnt in counts.items()))

if __name__ == '__main__':
    main()
`
  },
  {
    languageSlug: 'python',
    levelNumber: 6,
    title: 'Common Elements Between Two Sets',
    statement: 'Given two lines of space-separated integers, use set intersection to find elements present in both lines. Print the common elements in ascending sorted order separated by spaces, or "EMPTY" if none.',
    input_format: 'First line contains integers of set 1. Second line contains integers of set 2.',
    output_format: 'Print sorted common integers or "EMPTY".',
    constraints_text: '1 <= elements <= 1000',
    explanation: 'Line 1: 1 2 3 4; Line 2: 3 4 5 6. Intersection: 3 4.',
    samples: [
      { sample_input: '1 2 3 4\n3 4 5 6\n', expected_output: '3 4\n', explanation: 'Elements 3 and 4 appear in both' }
    ],
    test_cases: [
      { test_input: '1 2 3 4\n3 4 5 6\n', expected_output: '3 4\n', is_hidden: false },
      { test_input: '1 2\n3 4\n', expected_output: 'EMPTY\n', is_hidden: true },
      { test_input: '10 20 30\n20 10\n', expected_output: '10 20\n', is_hidden: true }
    ],
    starter_code: `import sys

def main():
    lines = sys.stdin.read().strip().split('\\n')
    if len(lines) >= 2:
        s1 = set(int(x) for x in lines[0].split())
        s2 = set(int(x) for x in lines[1].split())
        common = sorted(list(s1 & s2))
        if common:
            print(" ".join(str(x) for x in common))
        else:
            print("EMPTY")

if __name__ == '__main__':
    main()
`
  },
  {
    languageSlug: 'python',
    levelNumber: 6,
    title: 'Find Highest Scoring Student',
    statement: 'Read N student records where each line has a student name and their integer score. Find and print the name of the student with the maximum score. If there is a tie, print the student who appeared first.',
    input_format: 'First line contains N. The next N lines contain "<name> <score>".',
    output_format: 'Print the winner name.',
    constraints_text: '1 <= N <= 100',
    explanation: 'Alice 88, Bob 95, Charlie 92 -> Bob has highest score 95.',
    samples: [
      { sample_input: '3\nAlice 88\nBob 95\nCharlie 92\n', expected_output: 'Bob\n', explanation: 'Bob has highest score' }
    ],
    test_cases: [
      { test_input: '3\nAlice 88\nBob 95\nCharlie 92\n', expected_output: 'Bob\n', is_hidden: false },
      { test_input: '2\nTom 80\nJerry 80\n', expected_output: 'Tom\n', is_hidden: true },
      { test_input: '1\nWinner 100\n', expected_output: 'Winner\n', is_hidden: true }
    ],
    starter_code: `import sys

def main():
    lines = sys.stdin.read().strip().split('\\n')
    if lines:
        n = int(lines[0])
        best_name = None
        best_score = -10**9
        for line in lines[1:n+1]:
            parts = line.split()
            if len(parts) >= 2:
                name = parts[0]
                score = int(parts[1])
                if score > best_score:
                    best_score = score
                    best_name = name
        if best_name:
            print(best_name)

if __name__ == '__main__':
    main()
`
  },
  {
    languageSlug: 'python',
    levelNumber: 6,
    title: 'Invert Dictionary Mapping',
    statement: 'Given N key-value pairs (where all values are unique words), invert the dictionary so each value becomes the key and the old key becomes the value. Print the inverted pairs sorted alphabetically by new key, formatted as "<key> <value>", one per line.',
    input_format: 'First line contains N. The next N lines contain two space-separated words (key and value).',
    output_format: 'Print the inverted pairs sorted by new key, one per line.',
    constraints_text: '1 <= N <= 100',
    explanation: 'Pairs: a 1, b 2 inverted -> 1 a, 2 b.',
    samples: [
      { sample_input: '2\napple fruit\ncarrot vegetable\n', expected_output: 'fruit apple\nvegetable carrot\n', explanation: 'Inverted and sorted by new key' }
    ],
    test_cases: [
      { test_input: '2\napple fruit\ncarrot vegetable\n', expected_output: 'fruit apple\nvegetable carrot\n', is_hidden: false },
      { test_input: '1\none 1\n', expected_output: '1 one\n', is_hidden: true },
      { test_input: '3\nx c\ny b\nz a\n', expected_output: 'a z\nb y\nc x\n', is_hidden: true }
    ],
    starter_code: `import sys

def main():
    lines = sys.stdin.read().strip().split('\\n')
    if lines:
        n = int(lines[0])
        inverted = []
        for line in lines[1:n+1]:
            parts = line.split()
            if len(parts) >= 2:
                inverted.append((parts[1], parts[0]))
        inverted.sort(key=lambda x: x[0])
        for k, v in inverted:
            print(f"{k} {v}")

if __name__ == '__main__':
    main()
`
  },
  {
    languageSlug: 'python',
    levelNumber: 6,
    title: 'Group Anagrams Count',
    statement: 'Given N words, group words that are anagrams of each other together. Print the total count of distinct anagram groups.',
    input_format: 'First line contains N. The second line contains N space-separated words.',
    output_format: 'Print the count of distinct anagram groups.',
    constraints_text: '1 <= N <= 1000',
    explanation: 'Words ["eat", "tea", "tan", "ate", "nat", "bat"] form 3 groups: ["eat","tea","ate"], ["tan","nat"], ["bat"].',
    samples: [
      { sample_input: '6\neat tea tan ate nat bat\n', expected_output: '3\n', explanation: '3 anagram groups' }
    ],
    test_cases: [
      { test_input: '6\neat tea tan ate nat bat\n', expected_output: '3\n', is_hidden: false },
      { test_input: '3\na b c\n', expected_output: '3\n', is_hidden: true },
      { test_input: '4\nab ba ab ba\n', expected_output: '1\n', is_hidden: true }
    ],
    starter_code: `import sys

def main():
    tokens = sys.stdin.read().split()
    if tokens:
        n = int(tokens[0])
        words = tokens[1:n+1]
        groups = set()
        for w in words:
            key = "".join(sorted(w))
            groups.add(key)
        print(len(groups))

if __name__ == '__main__':
    main()
`
  }
];

module.exports = pythonQuestions;
