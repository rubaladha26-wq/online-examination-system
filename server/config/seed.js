require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const TeacherProfile = require('../models/TeacherProfile');
const Department = require('../models/Department');
const Course = require('../models/Course');
const Batch = require('../models/Batch');
const Subject = require('../models/Subject');
const Enrollment = require('../models/Enrollment');
const Syllabus = require('../models/Syllabus');
const Question = require('../models/Question');
const Examination = require('../models/Examination');
const SystemSetting = require('../models/SystemSetting');
const AuditLog = require('../models/AuditLog');

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai_examination_system';
    await mongoose.connect(mongoUri);
    console.log('[Seed] Connected to database');

    // Clear existing data for fresh seed
    await Promise.all([
      User.deleteMany({}),
      StudentProfile.deleteMany({}),
      TeacherProfile.deleteMany({}),
      Department.deleteMany({}),
      Course.deleteMany({}),
      Batch.deleteMany({}),
      Subject.deleteMany({}),
      Enrollment.deleteMany({}),
      Syllabus.deleteMany({}),
      Question.deleteMany({}),
      Examination.deleteMany({}),
      SystemSetting.deleteMany({}),
      AuditLog.deleteMany({}),
    ]);
    console.log('[Seed] Cleared old collections');

    // 1. Create System Settings
    await SystemSetting.create([
      {
        key: 'AI_MODEL',
        value: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        category: 'ai',
        description: 'Default AI model for question generation and descriptive grading',
      },
      {
        key: 'MAX_FILE_SIZE_MB',
        value: 15,
        category: 'upload_limits',
        description: 'Maximum syllabus file upload size in megabytes',
      },
      {
        key: 'DEFAULT_PASSING_PERCENTAGE',
        value: 40,
        category: 'exam_defaults',
        description: 'Standard passing mark threshold percentage',
      },
    ]);

    // 2. Create Departments, Courses, Batches
    const cseDept = await Department.create({
      name: 'Computer Science and Engineering',
      code: 'CSE',
      description: 'Department of Computer Science & Software Engineering',
      isActive: true,
    });

    const btechCourse = await Course.create({
      name: 'Bachelor of Technology in Computer Science',
      code: 'BTECH-CS',
      department: cseDept._id,
      totalSemesters: 8,
      durationYears: 4,
      description: 'Undergraduate professional degree in Computer Science',
    });

    const batch2024 = await Batch.create({
      name: 'CSE-2024-Section A',
      course: btechCourse._id,
      academicYear: '2024-2028',
      currentSemester: 3,
      section: 'A',
    });

    // 3. Create Users
    const defaultPassword = 'Password123!';

    const adminUser = await User.create({
      name: 'System Administrator',
      email: 'admin@exam.edu',
      password: defaultPassword,
      role: 'admin',
      isActive: true,
    });

    const teacherUser = await User.create({
      name: 'Dr. Alan Turing',
      email: 'teacher@exam.edu',
      password: defaultPassword,
      role: 'teacher',
      isActive: true,
    });

    const student1 = await User.create({
      name: 'Alex Johnson',
      email: 'student@exam.edu',
      password: defaultPassword,
      role: 'student',
      isActive: true,
    });

    const student2 = await User.create({
      name: 'Sarah Connor',
      email: 'student2@exam.edu',
      password: defaultPassword,
      role: 'student',
      isActive: true,
    });

    // 4. Create Subject and Assign Teacher
    const dsaSubject = await Subject.create({
      name: 'Data Structures and Algorithms',
      code: 'CS301',
      department: cseDept._id,
      course: btechCourse._id,
      semester: 3,
      credits: 4,
      assignedTeachers: [teacherUser._id],
    });

    // 5. Create Teacher & Student Profiles
    await TeacherProfile.create({
      user: teacherUser._id,
      employeeId: 'EMP-CSE-001',
      department: cseDept._id,
      designation: 'Professor & Head of Algorithms',
      assignedSubjects: [dsaSubject._id],
    });

    await StudentProfile.create({
      user: student1._id,
      rollNumber: 'STU-2024-001',
      department: cseDept._id,
      course: btechCourse._id,
      batch: batch2024._id,
      semester: 3,
    });

    await StudentProfile.create({
      user: student2._id,
      rollNumber: 'STU-2024-002',
      department: cseDept._id,
      course: btechCourse._id,
      batch: batch2024._id,
      semester: 3,
    });

    // Enroll students in subject
    await Enrollment.create([
      {
        student: student1._id,
        course: btechCourse._id,
        batch: batch2024._id,
        semester: 3,
        subjects: [dsaSubject._id],
      },
      {
        student: student2._id,
        course: btechCourse._id,
        batch: batch2024._id,
        semester: 3,
        subjects: [dsaSubject._id],
      },
    ]);

    // 6. Create Seed Syllabus with Units and Topics
    const seedSyllabus = await Syllabus.create({
      title: 'Data Structures & Algorithms Syllabus 2026',
      subject: dsaSubject._id,
      course: btechCourse._id,
      semester: 3,
      academicYear: '2024-2028',
      uploadedBy: teacherUser._id,
      fileName: 'dsa_syllabus_core.pdf',
      originalFileName: 'DSA_Course_Syllabus.pdf',
      fileType: 'pdf',
      fileSize: 1048576,
      filePath: 'uploads/syllabuses/dsa_seed.pdf',
      rawText: 'Comprehensive syllabus for CS301 covering Linear and Non-Linear Data Structures, Algorithmic Analysis, and Sorting/Searching Paradigms.',
      status: 'processed',
      units: [
        {
          unitNumber: 1,
          title: 'Linear Data Structures: Stacks, Queues, and Linked Lists',
          topics: [
            'Array vs Linked List Tradeoffs',
            'Singly and Doubly Linked Lists',
            'Stack ADT and Infix to Postfix Conversion',
            'Circular Queues and Priority Queues',
          ],
          learningObjectives: [
            'Understand memory allocation and cache locality of contiguous vs node-based structures',
            'Implement fundamental stack and queue primitives with O(1) operations',
          ],
          rawContent: 'Unit 1 covers sequential linear collections, memory pointers, dynamic resizing, and recursive evaluation using stack frames.',
        },
        {
          unitNumber: 2,
          title: 'Non-Linear Structures: Trees and Graphs',
          topics: [
            'Binary Search Trees and Invariant Properties',
            'AVL Trees and Rotations',
            'Breadth-First Search (BFS) and Depth-First Search (DFS)',
            'Dijkstra Shortest Path and Minimum Spanning Trees',
          ],
          learningObjectives: [
            'Analyze tree balancing and search worst-case versus average-case bounds',
            'Apply graph traversal techniques to real-world network routing problems',
          ],
          rawContent: 'Unit 2 explores hierarchical data representation, balanced binary search trees, adjacency representations, and graph algorithms.',
        },
        {
          unitNumber: 3,
          title: 'Algorithm Design: Sorting, Searching & Complexity Analysis',
          topics: [
            'Asymptotic Big-O, Omega, and Theta Notations',
            'Divide and Conquer: QuickSort and MergeSort',
            'Heap Sort and Binary Heap Operations',
            'Hash Tables and Collision Resolution Techniques',
          ],
          learningObjectives: [
            'Mathematically prove algorithmic recurrence relations',
            'Select appropriate sorting and hash strategies based on dataset characteristics',
          ],
          rawContent: 'Unit 3 focuses on computational complexity, divide-and-conquer recurrences, in-place sorting stability, and hash bucket distributions.',
        },
      ],
    });

    // 7. Create Questions of diverse types
    const questionsData = [
      {
        subject: dsaSubject._id,
        syllabus: seedSyllabus._id,
        unitNumber: 1,
        topic: 'Stack ADT and Infix to Postfix Conversion',
        learningObjective: 'Implement fundamental stack and queue primitives',
        questionText: 'Which data structure is primarily utilized for evaluating postfix arithmetic expressions and managing runtime subroutine call stacks?',
        questionType: 'mcq',
        difficulty: 'easy',
        cognitiveLevel: 'remember',
        marks: 2,
        options: [
          { id: 'A', text: 'Queue (FIFO)', isCorrect: false },
          { id: 'B', text: 'Stack (LIFO)', isCorrect: true },
          { id: 'C', text: 'Min-Heap', isCorrect: false },
          { id: 'D', text: 'Hash Map', isCorrect: false },
        ],
        correctAnswer: 'B',
        explanation: 'A Stack operates on Last-In-First-Out (LIFO) semantics, making it ideal for tracking nested operator precedence and function call activation records.',
        status: 'approved',
        aiGenerated: true,
        createdBy: teacherUser._id,
        approvedBy: teacherUser._id,
      },
      {
        subject: dsaSubject._id,
        syllabus: seedSyllabus._id,
        unitNumber: 2,
        topic: 'Binary Search Trees and Invariant Properties',
        learningObjective: 'Analyze tree balancing and search bounds',
        questionText: 'What is the worst-case time complexity of searching for an element in an un-balanced Binary Search Tree (BST) with N nodes?',
        questionType: 'mcq',
        difficulty: 'medium',
        cognitiveLevel: 'understand',
        marks: 2,
        options: [
          { id: 'A', text: 'O(log N)', isCorrect: false },
          { id: 'B', text: 'O(1)', isCorrect: false },
          { id: 'C', text: 'O(N)', isCorrect: true },
          { id: 'D', text: 'O(N log N)', isCorrect: false },
        ],
        correctAnswer: 'C',
        explanation: 'In the worst case (e.g. elements inserted in monotonically sorted order), the BST degenerates into a linear linked list with O(N) traversal depth.',
        status: 'approved',
        aiGenerated: true,
        createdBy: teacherUser._id,
        approvedBy: teacherUser._id,
      },
      {
        subject: dsaSubject._id,
        syllabus: seedSyllabus._id,
        unitNumber: 3,
        topic: 'Divide and Conquer: QuickSort and MergeSort',
        learningObjective: 'Mathematically analyze algorithmic recurrence relations',
        questionText: 'Which of the following statements regarding MergeSort are TRUE? (Select ALL that apply)',
        questionType: 'multiple_select',
        difficulty: 'medium',
        cognitiveLevel: 'analyze',
        marks: 3,
        options: [
          { id: 'A', text: 'Guarantees O(N log N) worst-case time complexity.', isCorrect: true },
          { id: 'B', text: 'Operates in O(1) auxiliary space without requiring extra memory.', isCorrect: false },
          { id: 'C', text: 'It is a stable sorting algorithm.', isCorrect: true },
          { id: 'D', text: 'Uses the Divide-and-Conquer algorithmic design paradigm.', isCorrect: true },
        ],
        correctAnswer: JSON.stringify(['A', 'C', 'D']),
        explanation: 'MergeSort provides guaranteed O(N log N) time and stability, but requires O(N) auxiliary memory for the merge buffer.',
        status: 'approved',
        aiGenerated: true,
        createdBy: teacherUser._id,
        approvedBy: teacherUser._id,
      },
      {
        subject: dsaSubject._id,
        syllabus: seedSyllabus._id,
        unitNumber: 2,
        topic: 'AVL Trees and Rotations',
        learningObjective: 'Analyze tree balancing algorithms',
        questionText: 'True or False: In an AVL tree, the balance factor of every node must be strictly within the set {-1, 0, 1}.',
        questionType: 'true_false',
        difficulty: 'easy',
        cognitiveLevel: 'remember',
        marks: 1,
        options: [
          { id: 'T', text: 'True', isCorrect: true },
          { id: 'F', text: 'False', isCorrect: false },
        ],
        correctAnswer: 'True',
        explanation: 'The fundamental AVL balance invariant dictates that the difference between left and right subtree heights cannot exceed 1.',
        status: 'approved',
        aiGenerated: true,
        createdBy: teacherUser._id,
        approvedBy: teacherUser._id,
      },
      {
        subject: dsaSubject._id,
        syllabus: seedSyllabus._id,
        unitNumber: 3,
        topic: 'Hash Tables and Collision Resolution Techniques',
        learningObjective: 'Select appropriate hashing strategies',
        questionText: 'The technique of resolving hash collisions by storing colliding elements in a linked list at the same bucket index is known as Separate _______.',
        questionType: 'fill_blanks',
        difficulty: 'easy',
        cognitiveLevel: 'remember',
        marks: 2,
        correctAnswer: 'Chaining',
        explanation: 'Separate Chaining resolves hash collisions by chaining linked list nodes to the primary array bucket slot.',
        status: 'approved',
        aiGenerated: true,
        createdBy: teacherUser._id,
        approvedBy: teacherUser._id,
      },
      {
        subject: dsaSubject._id,
        syllabus: seedSyllabus._id,
        unitNumber: 1,
        topic: 'Array vs Linked List Tradeoffs',
        learningObjective: 'Understand memory layout and time complexity',
        questionText: 'Explain the fundamental difference between Arrays and Linked Lists regarding spatial memory locality and dynamic resizing overhead.',
        questionType: 'short_answer',
        difficulty: 'medium',
        cognitiveLevel: 'understand',
        marks: 5,
        correctAnswer: 'Arrays reside in contiguous memory providing superior spatial CPU cache locality with fixed size, requiring O(N) copy on resize. Linked Lists have non-contiguous memory, poor cache locality, pointer memory overhead, but offer O(1) dynamic insertion without bulk array re-allocation.',
        rubricCriteria: [
          { criterion: 'Accurate contrast of contiguous vs non-contiguous layout and cache locality', points: 2.5 },
          { criterion: 'Clear explanation of resizing tradeoffs and pointer memory overhead', points: 2.5 },
        ],
        explanation: 'Full marks require highlighting cache line fetching benefits in contiguous memory and dynamic growth mechanisms.',
        status: 'approved',
        aiGenerated: true,
        createdBy: teacherUser._id,
        approvedBy: teacherUser._id,
      },
      {
        subject: dsaSubject._id,
        syllabus: seedSyllabus._id,
        unitNumber: 3,
        topic: 'Asymptotic Big-O, Omega, and Theta Notations',
        learningObjective: 'Prove algorithmic recurrence relations',
        questionText: 'Given an array of size N = 1024, calculate the maximum number of element comparisons executed by standard Binary Search in the worst-case scenario.',
        questionType: 'numerical',
        difficulty: 'easy',
        cognitiveLevel: 'apply',
        marks: 3,
        correctAnswer: '10',
        explanation: 'log2(1024) = 10 comparisons in the worst case.',
        status: 'approved',
        aiGenerated: true,
        createdBy: teacherUser._id,
        approvedBy: teacherUser._id,
      },
      {
        subject: dsaSubject._id,
        syllabus: seedSyllabus._id,
        unitNumber: 2,
        topic: 'Dijkstra Shortest Path and Minimum Spanning Trees',
        learningObjective: 'Apply graph traversal to real-world network routing problems',
        caseStudyContext: 'A telecommunications infrastructure provider maintains 5 regional data centers connected by high-speed fiber links with non-negative latency weights. During peak hours, packets must travel along the path of minimum total latency between any ingress node and server clusters.',
        questionText: 'Which graph algorithm should the network routing software deploy to compute single-source shortest paths on this network, and what is its optimal time complexity when implemented with a Fibonacci Heap?',
        questionType: 'case_study',
        difficulty: 'hard',
        cognitiveLevel: 'evaluate',
        marks: 5,
        correctAnswer: "Dijkstra's Algorithm. With a Fibonacci heap, its optimal time complexity is O(|E| + |V| log |V|).",
        rubricCriteria: [
          { criterion: "Identification of Dijkstra's Algorithm for non-negative weights", points: 2.5 },
          { criterion: 'Accurate time complexity with Fibonacci Heap: O(E + V log V)', points: 2.5 },
        ],
        explanation: "Dijkstra's algorithm is optimal for non-negative weights and achieves O(E + V log V) with a Fibonacci Heap.",
        status: 'approved',
        aiGenerated: true,
        createdBy: teacherUser._id,
        approvedBy: teacherUser._id,
      },
      {
        subject: dsaSubject._id,
        syllabus: seedSyllabus._id,
        unitNumber: 1,
        topic: 'Circular Queues and Priority Queues',
        learningObjective: 'Implement fundamental stack and queue primitives',
        questionText: 'Match each Queue variant with its defining behavioral characteristic:',
        questionType: 'match_following',
        difficulty: 'medium',
        cognitiveLevel: 'understand',
        marks: 4,
        matchPairs: [
          { left: 'FIFO Standard Queue', right: 'First inserted element is dequeued first' },
          { left: 'Circular Queue', right: 'Reuses released front memory slots via modulo indexing' },
          { left: 'Priority Queue', right: 'Element with highest ranking key is dequeued first' },
          { left: 'Double-Ended Queue (Deque)', right: 'Supports insertion and deletion at both ends' },
        ],
        correctAnswer: 'Pairs defined as listed',
        explanation: 'Each queue variant optimizes specific access patterns.',
        status: 'approved',
        aiGenerated: true,
        createdBy: teacherUser._id,
        approvedBy: teacherUser._id,
      },
      {
        subject: dsaSubject._id,
        syllabus: seedSyllabus._id,
        unitNumber: 3,
        topic: 'Asymptotic Big-O, Omega, and Theta Notations',
        learningObjective: 'Prove algorithmic recurrence relations',
        questionText: 'Thoroughly explain Master Theorem for solving Divide-and-Conquer recurrences in the form T(n) = aT(n/b) + f(n). State all 3 asymptotic cases and provide one concrete algorithmic example for each case.',
        questionType: 'long_descriptive',
        difficulty: 'hard',
        cognitiveLevel: 'create',
        marks: 5,
        correctAnswer: 'Case 1: f(n) = O(n^(log_b(a) - e)) -> T(n) = Theta(n^log_b(a)), e.g. Strassen matrix multiplication. Case 2: f(n) = Theta(n^(log_b(a))) -> T(n) = Theta(n^log_b(a) * log n), e.g. MergeSort. Case 3: f(n) = Omega(n^(log_b(a) + e)) with regularity condition -> T(n) = Theta(f(n)).',
        rubricCriteria: [
          { criterion: 'Standard recurrence form definition a >= 1, b > 1', points: 1.0 },
          { criterion: 'Case 1 mathematical condition and example', points: 1.0 },
          { criterion: 'Case 2 mathematical condition and example', points: 1.5 },
          { criterion: 'Case 3 mathematical condition, regularity check and example', points: 1.5 },
        ],
        explanation: 'Master Theorem simplifies solving recurrence equations by comparing the root work f(n) to tree leaf count n^log_b(a).',
        status: 'approved',
        aiGenerated: true,
        createdBy: teacherUser._id,
        approvedBy: teacherUser._id,
      },
    ];

    const createdQuestions = await Question.insertMany(questionsData);
    console.log(`[Seed] Inserted ${createdQuestions.length} approved questions into question bank`);

    // 8. Create a Live Published Examination with these questions
    const questionIds = createdQuestions.map((q) => q._id);
    const totalMarks = createdQuestions.reduce((acc, q) => acc + (q.marks || 1), 0);

    const now = new Date();
    const startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // started yesterday
    const endDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // ends in 14 days

    const liveExam = await Examination.create({
      title: 'CS301: Mid-Term Examination on Data Structures & Algorithms',
      code: 'DSA-MID-2026',
      description: 'Official Mid-Term Examination covering Linear & Non-Linear Data Structures, Algorithmic Complexity, and Asymptotics.',
      instructions: '1. The exam contains 10 questions of varying types (MCQ, Multi-select, True/False, Fill in blanks, Numerical, Short answer, and Case Study).\n2. Time is enforced strictly by the server (60 minutes).\n3. Answers are automatically saved in real time.\n4. Ensure a stable network connection before submitting.',
      subject: dsaSubject._id,
      syllabus: seedSyllabus._id,
      createdBy: teacherUser._id,
      eligibleCourses: [btechCourse._id],
      eligibleBatches: [batch2024._id],
      startDate,
      endDate,
      durationMinutes: 60,
      totalMarks: totalMarks, // 32 marks
      passingMarks: 12,
      maxAttempts: 2,
      status: 'published',
      questionSelectionMethod: 'manual',
      questions: questionIds,
      randomizeQuestions: false,
      randomizeOptions: false,
      enableNegativeMarking: true,
      negativeMarkingPenalty: 0.25,
      releaseResultsImmediately: true, // Results viewable immediately upon submission for live demonstration!
      allowDescriptiveAIGrading: true,
    });

    console.log(`[Seed] Created Live Examination: "${liveExam.title}" (Code: ${liveExam.code})`);
    console.log('====================================================');
    console.log('✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('👤 Admin:    admin@exam.edu    / Password123!');
    console.log('👤 Teacher:  teacher@exam.edu  / Password123!');
    console.log('👤 Student:  student@exam.edu  / Password123!');
    console.log('👤 Student2: student2@exam.edu / Password123!');
    console.log('====================================================');

    process.exit(0);
  } catch (error) {
    console.error(`[Seed Error]: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
};

seedData();
