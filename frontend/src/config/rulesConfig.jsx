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
    info: [
      "Each team receives an equal number of first-hand questions based on the value you enter in the 'Number of Questions' field.",

      "Teams earn points for answering correctly, based on the Points per Question setting.",

      "If Enable Pass is turned on, a question can be passed through all teams one by one.",

      "When a team receives a passed question, they get a pass timer and earn pass points for answering correctly.",

      "If a question is passed by all teams, the correct answer will be revealed with no points awarded. Additionally, if a team selects an incorrect option, the correct answer will be shown, and the next question will go to the next team in the queue.",

      "Wrong answers or timeouts deduct points if Enable Negative is turned on.",

      "Enable Pass and Enable Negative cannot be enabled at the same time.",
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
    info: [
      "This round includes categories such as English, Technology/IT, History, Biology, Maths, Physics, Chemistry, and more.",

      "Before each first-hand question, a category selection panel appears. The chosen category determines the question displayed.",

      "Each team receives an equal number of first-hand questions based on the 'Number of Questions' value.",

      "Teams earn points for correct answers based on the Points per Question setting.",

      "If Enable Pass is turned on, the question can be passed through all teams.",

      "When a team receives a passed question, they get a pass timer and earn pass points for answering correctly.",

      "If a question is passed by all teams, the correct answer will be revealed with no points awarded. Additionally, if a team selects an incorrect option, the correct answer will be shown, and the next question will go to the next team in the queue.",

      "Wrong answers or timeouts deduct points if Enable Negative is turned on.",

      "Enable Pass and Enable Negative cannot be enabled at the same time.",
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
    info: [
      "This round contains several estimation questions based on the 'Number of Questions' value.",

      "There is no negative scoring in this round.",

      "The team whose answer is closest to the correct value earns points based on the Points per Question setting.",
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
    info: [
      "Each team receives a fixed amount of time (Time Limit) to answer a set number of questions.",

      "The Time Limit applies to the entire collection of questions assigned to that team.",

      "A team cannot move to the next question until they answer or pass the current one (if Enable Pass is on).",

      "Enable Pass in this round does not give questions to other teams — it only skips the current question.",

      "Wrong answers or timeouts deduct points if Enable Negative is turned on.",

      "Enable Pass and Enable Negative cannot be enabled at the same time.",
    ],
  },

  buzzer_round: {
    roundNumber: 5,
    roundTitle: "Buzzer Round",
    settings: {
      timerPerTeam: 15,
      questionTotalTime: 30,
      pointsPerCorrectAnswer: 10,
      negativePoints: 5,
      queueMultipleBuzzers: true,
    },
    info: [
      "A fixed number of questions will be asked to all teams.",

      "Each team receives an alphabet key to use as their buzzer, based on the order in which the teams were created.",

      "Teams have a 60-second Pre-Buzz Timer to press their buzzer.",

      "If no team buzzes, the question is skipped.",

      "If only some teams buzz, only those teams can answer, and in the exact order they buzzed.",

      "The Pre-Buzz Timer starts when 'Show Question' is pressed.",

      "Each team gets 15 seconds to answer after buzzing.",

      "The team that buzzes first gets the first chance to answer.",

      "Correct answers award points based on the Points per Question setting.",

      "Wrong answers deduct points if Enable Negative is turned on.",

      "Remaining silent after buzzing also deducts negative points if negative marking is enabled.",
    ],
  },
};

export default rulesConfig;
