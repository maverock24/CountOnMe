    // app/api/analyze.ts

    import { GoogleGenerativeAI, GenerationConfig } from '@google/generative-ai';

    // Initialize the Google AI client with the secure API key from environment variables
    if (!process.env.GOOGLE_API_KEY) {
    throw new Error('GOOGLE_API_KEY environment variable is not set.');
    }
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

    interface WorkoutPlan {
    reps: string;
    exercise: string;
    weight: number;
    calories: number;
    explanation: string;
    }

    // The function signature remains the same, using standard web Request and Response.
    export async function POST(req: Request): Promise<Response> {
    try {
        const { weight, exercise, calories, trainingLevel } = await req.json();

        // Updated validation to remove 'goal'
        if (!((weight && exercise) || calories)) {
        return Response.json(
            { error: 'Missing required fields: provide either weight and exercise, or calories.' },
            { status: 400 }
        );
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

        /**
         * --- PROMPT IMPROVEMENT ---
         * The new prompt includes a dedicated "RULES" section with clear conditional logic
         * to handle the user's specific requirements.
         */
        const basePrompt = `You are an expert fitness planner creating a workout plan.
        Fill out all fields of the required JSON structure based on the user's input, estimating where necessary to create a complete and logical plan.

        **IMPORTANT RULES FOR THE 'reps' FIELD:**
        1.  First, analyze the user's requested 'exercise'.
        2.  IF the exercise is a continuous endurance activity (like running, cycling, swimming, skating, rowing, elliptical, etc.), the 'reps' value MUST be a single number as a string, representing the total workout duration in minutes (e.g., "30").
        3.  OTHERWISE, for all other exercises (like pull-ups, push-ups, weightlifting, HIIT, calisthenics), the 'reps' value MUST be a semicolon-separated string of alternating exercise and break times in minutes (e.g., "2;3;2;3;2").
        4.  For these interval plans, NO single exercise or break duration can exceed 10 minutes.
        5.  Provide an 'explanation' for the chosen values but do not explain the 'reps'.
        6.  For calculating the 'calories' field, use Metabolic Equivalent of Task (MET)
        values based on the user's weight and exercise type. The formula is:
            calories = MET * weight (kg) * duration (hours).
        Now, create the plan based on the following input.

        User Input: `;
        
        // Updated userContext to remove 'goal'
        const userContext = calories
        ? `The user wants to burn approximately ${calories} calories.`
        : `The user weighs ${weight}kg, and wants to perform ${exercise} and is at a ${trainingLevel} training level.`;

        const fullPrompt = basePrompt + userContext;

        const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash-latest',
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: schema,
        } as GenerationConfig,
        });

        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const responseText = response.text();

        const data: WorkoutPlan = JSON.parse(responseText);

        return Response.json(data);

    } catch (error: any) {
        console.error('Error in /api/analyze:', error);
        const errorMessage = error.message || 'Failed to get advice from AI.';
        return Response.json(
        { error: errorMessage },
        { status: 500 }
        );
    }
    }
