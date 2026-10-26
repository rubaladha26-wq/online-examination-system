const Syllabus = require('../models/Syllabus');
const Question = require('../models/Question');
const Subject = require('../models/Subject');
const aiService = require('./aiService');

/**
 * Service to orchestrate AI question generation from uploaded syllabus
 */
const generateQuestionsForSyllabus = async ({
  syllabusId,
  unitNumbers,
  questionTypes,
  count = 10,
  difficultyDistribution = { easy: 30, medium: 50, hard: 20 },
  cognitiveLevels,
  language = 'English',
  includeExplanations = true,
  userId,
}) => {
  const syllabus = await Syllabus.findById(syllabusId).populate('subject');
  if (!syllabus) {
    throw new Error('Syllabus not found');
  }

  if (!syllabus.units || syllabus.units.length === 0) {
    throw new Error('This syllabus has no parsed units. Please parse or re-upload the syllabus first.');
  }

  // Filter units if specific unitNumbers were requested
  let targetUnits = syllabus.units;
  if (Array.isArray(unitNumbers) && unitNumbers.length > 0) {
    targetUnits = syllabus.units.filter((u) => unitNumbers.includes(u.unitNumber));
    if (targetUnits.length === 0) {
      targetUnits = syllabus.units; // fallback to all units
    }
  }

  const requestedTypes =
    Array.isArray(questionTypes) && questionTypes.length > 0
      ? questionTypes
      : ['mcq', 'short_answer', 'true_false'];

  const subjectName = syllabus.subject ? syllabus.subject.name : syllabus.title;

  // Call AI Service
  const aiResult = await aiService.generateQuestionsAI({
    subjectName,
    units: targetUnits,
    requestedTypes,
    count: Math.min(50, Math.max(1, parseInt(count, 10) || 10)),
    difficultyDistribution,
    cognitiveLevels,
    language,
    includeExplanations,
  });

  const savedQuestions = [];

  for (const rawQ of aiResult.questions) {
    // Validate required fields
    if (!rawQ.questionText || !rawQ.questionType) continue;

    const questionDoc = new Question({
      subject: syllabus.subject._id || syllabus.subject,
      syllabus: syllabus._id,
      unitNumber: rawQ.unitNumber || (targetUnits[0] ? targetUnits[0].unitNumber : 1),
      topic: rawQ.topic || (targetUnits[0] ? targetUnits[0].title : 'General'),
      learningObjective: rawQ.learningObjective || '',
      questionText: rawQ.questionText,
      questionType: rawQ.questionType,
      difficulty: rawQ.difficulty || 'medium',
      cognitiveLevel: rawQ.cognitiveLevel || 'understand',
      marks: rawQ.marks || (rawQ.questionType === 'long_descriptive' ? 5 : 1),
      negativeMarks: rawQ.negativeMarks || 0,
      options: Array.isArray(rawQ.options) ? rawQ.options : [],
      matchPairs: Array.isArray(rawQ.matchPairs) ? rawQ.matchPairs : [],
      correctAnswer: typeof rawQ.correctAnswer === 'object' ? JSON.stringify(rawQ.correctAnswer) : String(rawQ.correctAnswer || ''),
      caseStudyContext: rawQ.caseStudyContext || '',
      rubricCriteria: Array.isArray(rawQ.rubricCriteria) ? rawQ.rubricCriteria : [],
      explanation: rawQ.explanation || '',
      sourceTopic: rawQ.sourceTopic || rawQ.topic || '',
      status: 'draft', // Draft status until teacher approves!
      aiGenerated: true,
      aiMetadata: {
        model: (aiResult.metadata && aiResult.metadata.model) || 'GroundedAI',
        generatedAt: new Date(),
      },
      createdBy: userId,
    });

    await questionDoc.save();
    savedQuestions.push(questionDoc);
  }

  return {
    totalGenerated: savedQuestions.length,
    questions: savedQuestions,
    metadata: aiResult.metadata,
  };
};

module.exports = {
  generateQuestionsForSyllabus,
};
