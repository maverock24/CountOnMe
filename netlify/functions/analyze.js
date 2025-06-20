const { GoogleGenerativeAI } = require('@google/generative-ai');

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }

  if (!process.env.GOOGLE_API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'GOOGLE_API_KEY environment variable is not set.' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }

  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

  try {
    let body = {};
    try {
      body = JSON.parse(event.body || '{}');
    } catch (e) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid JSON body.' }),
        headers: { 'Content-Type': 'application/json' },
      };
    }
    let { weight, exercise, calories, trainingLevel } = body;

    // Coerce weight to a number if present
    if (weight !== undefined) {
      weight = Number(weight);
      if (isNaN(weight)) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Weight must be a valid number.' }),
          headers: { 'Content-Type': 'application/json' },
        };
      }
    }
    // Coerce calories to a number if present
    if (calories !== undefined) {
      calories = Number(calories);
      if (isNaN(calories)) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Calories must be a valid number.' }),
          headers: { 'Content-Type': 'application/json' },
        };
      }
    }

    // Validate required fields: either (weight is a number & exercise is non-empty) OR (calories is a number)
    const hasWeightAndExercise = typeof weight === 'number' && !isNaN(weight) && typeof exercise === 'string' && exercise.trim().length > 0;
    const hasCalories = typeof calories === 'number' && !isNaN(calories);
    if (!(hasWeightAndExercise || hasCalories)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields: provide either weight (number) and exercise (string), or calories (number).' }),
        headers: { 'Content-Type': 'application/json' },
      };
    }

    const schema = {
      type: "OBJECT",
      properties: {
        reps: { type: "STRING" },
        exercise: { type: "STRING" },
        weight: { type: "NUMBER" },
        calories: { type: "NUMBER" },
        explanation: { type: "STRING"}
      },
      required: ["reps", "exercise", "weight", "calories"],
    };

    const basePrompt = `You are an expert fitness planner creating a workout plan.\nFill out all fields of the required JSON structure based on the user's input, estimating where necessary to create a complete and logical plan.\n**IMPORTANT RULES FOR THE 'reps' FIELD:**\n1.  First, analyze the user's requested 'exercise'.\n2.  IF the exercise is a continuous endurance activity (like running, cycling, swimming, skating, rowing, elliptical, etc.), the 'reps' value MUST be a single number as a string, representing the total workout duration in minutes (e.g., "30").\n3.  OTHERWISE, for all other exercises (like pull-ups, push-ups, weightlifting, HIIT, calisthenics), the 'reps' value MUST be a semicolon-separated string of alternating exercise and break times in minutes (e.g., "2;3;2;3;2").\n4.  For these interval plans, NO single exercise or break duration can exceed 10 minutes.\n5.  Provide an 'explanation' for the chosen values but do not explain the 'reps'.\n6.  For calculating the 'calories' field, use Metabolic Equivalent of Task (MET)\nvalues based on the user's weight and exercise type. The formula is:\n    calories = MET * weight (kg) * duration (hours).\nNow, create the plan based on the following input.\n\nUser Input: `;

    const userContext = hasCalories
      ? `The user wants to burn approximately ${calories} calories.`
      : `The user weighs ${weight}kg, and wants to perform ${exercise} and is at a ${trainingLevel} training level.`;

    const fullPrompt = basePrompt + userContext;

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash-latest',
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const responseText = response.text();

    const data = JSON.parse(responseText);
    return {
      statusCode: 200,
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' },
    };
  } catch (error) {
    console.error('Error in analyze function:', error);
    const errorMessage = error.message || 'Failed to get advice from AI.';
    return {
      statusCode: 500,
      body: JSON.stringify({ error: errorMessage }),
      headers: { 'Content-Type': 'application/json' },
    };
  }
};