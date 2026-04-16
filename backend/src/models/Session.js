import mongoose from 'mongoose';

/**
 * Anonymous Telemetry Schema (Epiqora)
 * STRICT RULE: No PII (Names, Emails, IPs, or Images) are ever stored here.
 */
const sessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true, 
    },
    
    // Tracks UX Completion Rate
    dropoffPoint: {
      type: String,
      enum: ['UPLOADED_PHOTO', 'ANALYZED', 'ANSWERED_QUESTIONS', 'FINISHED_REPORT'],
      default: 'UPLOADED_PHOTO',
    },

    // Tracks AI Demographics & Confidence
    aiInitialScan: {
      skinType: String,
      confidenceScore: Number,
      primaryConcern: String,
      acnePresent: Boolean,
    },

    // Tracks User Engagement & AI Dynamic Prompting
    consultationLog: [
      {
        question: String,
        answer: mongoose.Schema.Types.Mixed, 
      }
    ],

    // Tracks Clinical Advice Quality
    finalRegimen: {
      type: mongoose.Schema.Types.Mixed, 
    },
  },
  {
    timestamps: true, 
  }
);

const Session = mongoose.model('Session', sessionSchema);

export default Session;