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
      "Each team receives an equal number of first-hand questions, based on the value entered in the Number of Questions field in the Question Info section.",

      "If Enable Timer is turned on, each question must be answered within the time specified in the Time Limit field.",

      "Teams earn points for correct answers based on the Points per Question value.",

      "If Enable Pass is enabled, a question may be passed only once. The Pass Limit field controls the total number of passes allowed throughout the round, preventing unlimited passing.",

      "When a question is passed to another team, the receiving team gets a pass timer (as set in the Enable Pass section) and earns passed points for a correct response.",

      "If Enable Negative is enabled, points will be deducted for each wrong answer or if the timer runs out, based on the Negative Points field.",

      "Enable Pass and Enable Negative cannot be used at the same time.",
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
      "This round includes professional category sections such as English, Nepali, Technology/IT, History, Biology, Maths, Physics, Chemistry.",

      "Before each first-hand question, a category selection panel will appear. Selecting a category will display a question from that category. (Categories shown depend on the types of questions chosen for this round.)",

      "Each team receives an equal number of first-hand questions, based on the value entered in the Number of Questions field in the Question Info section.",

      "If Enable Timer is turned on, each question must be answered within the time specified in the Time Limit field.",

      "Teams earn points for correct answers based on the Points per Question value.",

      "If Enable Pass is enabled, a question may be passed only once. The Pass Limit field controls the total number of passes allowed throughout the round, preventing unlimited passing.",

      "When a question is passed to another team, the receiving team gets a pass timer (as set in the Enable Pass section) and earns passed points for a correct response.",

      "If Enable Negative is enabled, points will be deducted for each wrong answer or if the timer runs out, based on the Negative Points field.",

      "Enable Pass and Enable Negative cannot be used at the same time.",
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
      "This round consists of a set number of estimation questions, based on the value entered in the Number of Questions field in the Question Info section.",

      "There is no negative pointing",

      "The team whose estimation is closest to the correct answer earns points, determined by the Points per Question value in the Question Info section.",
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
      "Each team is given a fixed amount of time (based on the Time Limit field) to answer a set number of questions, as specified in the Number of Questions field in the Question Info section.",

      "In this round, the Time Limit represents the total time allocated for the entire series of questions assigned to a single team.",

      "A team will not receive the next question until they answer or pass the current one (if Enable Pass is turned on).",

      "Here, Enable Pass does not pass the question to another team. It simply allows skipping the current question and moving to the next.",

      "If Enable Negative is enabled, points will be deducted for each wrong answer or if the timer runs out, based on the Negative Points field.",

      "Enable Pass and Enable Negative cannot be used at the same time.",
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
      "A specific number of questions (based on the Number of Questions field in the Question Info section) will be asked, and all teams must attempt to answer them one after another.",

      "Each team is assigned an alphabet key to use as their buzzer. Teams may press their assigned key or click the on-screen buzzer displayed with their team name. The assigned key is determined by the order in which the teams were created in Step 2 of the quiz setup",

      "Teams must press their buzzer within a 60-second window named as Pre-Buzz Timer.",

      "If no team buzzes, the question is skipped.",

      "If only some teams buzz, only those teams get to answer, in the exact order in which they pressed their buzzer.",

      "The Pre-Buzz timer starts when Show Question is pressed.",

      "The team that presses the buzzer first gets the first chance to answer.",

      "A correct answer awards points (based on the Points per Question value).",

      "A wrong answer deducts points (based on the Negative Points field) if Enable Negative is on.",

      "Remaining silent after buzzing also deducts negative points if negative scoring is enabled. If not enabled, no points are deducted when the timer runs out or the team stays silent.",

      "After buzzing, each team has 15 seconds to answer the question.",
    ],
  },
};

export default rulesConfig;
