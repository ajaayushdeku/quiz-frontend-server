const rulesConfig = {
  general_round: {
    roundNumber: 1,
    roundTitle: "General Round",
    settings: {
      teamTimeLimit: 60,
      passTimeLimit: 30,
      points: {
        firstHand: 5,
        secondHand: 3,
      },
      maxQuestionsPerTeam: 2,
      reverseOrderAfterFirstHand: true,
    },
    rules: [
      "Each team gets 2 first-hand questions to be answered in 1 minute and is awarded 5 points for the correct response.",
      "A question can pass only once.",
      "If passed to the other, the 2nd team gets 30 seconds to answer it and 3 points for the right answer.",
      "In case the bell goes while a team is answering the question, the team gets the opportunity to complete it.",
    ],
  },

  subject_round: {
    roundNumber: 2,
    roundTitle: "Subject Round",
    settings: {
      teamTimeLimit: 60,
      passTimeLimit: 30,
      points: {
        firstHand: 5,
        secondHand: 3,
      },
      maxQuestionsPerTeam: 2,
      reverseOrderAfterFirstHand: true,
    },
    rules: [
      "This round will consist of specified professional sections like English, Nepali, Computer, Biology, Maths, Physics, and Chemistry.",
      "All the rules are similar to the General Round.",
    ],
  },

  estimation_round: {
    roundNumber: 3,
    roundTitle: "Estimation Round",
    settings: {
      maxTeams: 4,
      autoNextAfterAllAnswered: true,
      delayBeforeNextQuestion: 500,
      pointsPerClosest: 5,
    },
    rules: [
      "This round comprises 3 questions for estimation.",
      "The team that notes the closest estimation will be rewarded with 5 points.",
      "(The team members can sense the objects used for estimation.)",
    ],
  },

  rapid_fire_round: {
    roundNumber: 4,
    roundTitle: "Rapid Fire Round",
    settings: {
      roundTime: 120,
      pointsPerCorrectAnswer: 2,
      autoMoveOnPass: true,
    },
    rules: [
      "Each team gets 2 minutes for 8 questions in a row.",
      "They won't get the next question until they answer or pass.",
      "Each correct answer brings 2 points but no negative marking prevails.",
    ],
  },

  buzzer_round: {
    roundNumber: 5,
    roundTitle: "Buzzer Round",
    settings: {
      timerPerTeam: 10,
      questionTotalTime: 30,
      pointsPerCorrectAnswer: 10,
      negativePoints: 5,
      queueMultipleBuzzers: true,
    },
    rules: [
      "5 questions will be fired at all the teams one after another.",
      "The team members can discuss among themselves and then press the buzzer to answer the question first. No discussion is allowed after the buzzer.",
      "The team that presses the buzzer/bell first gets a chance to answer it. Correct answer earns 10 points but wrong one costs 5 negative points. Silence even after the buzzer also costs 5 negative points.",
      "If a team presses the buzzer before the question is over, they must answer the incomplete question correctly or face 5 negative points.",
      "Each question has to be answered in 10 seconds after the buzzer.",
      "There are no choices in this round.",
      "If two teams press the buzzer/bell together, there will be a draw of cards to decide who gets the chance to answer. If the first team answers correctly, they get a point. Wrong answer deducts 5 points, then the next team gets a chance.",
    ],
  },
};

export default rulesConfig;
