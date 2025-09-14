#!/usr/bin/env python3
"""
Script to update existing risks in PostgreSQL database with fake data
"""

import sys
import os
from datetime import datetime
import random

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.risk import Risk
from app.models.user import User

# Sample data for different risk categories
PROBABILITY_BASIS_SAMPLES = {
    "operational": [
        "Based on historical incident data showing similar operational failures occurring 2-3 times per year in comparable organizations.",
        "Analysis of current process controls indicates moderate vulnerability due to manual intervention requirements.",
        "Recent system upgrades have reduced likelihood, but legacy components still present some risk.",
        "Staff training completion rates and process documentation quality suggest moderate probability.",
        "Vendor reliability assessments and service level agreements indicate this risk is possible but not frequent."
    ],
    "financial": [
        "Market volatility analysis and economic indicators suggest moderate probability of occurrence.",
        "Historical financial data shows similar events have occurred in 15-20% of comparable periods.",
        "Current budget constraints and resource allocation patterns increase likelihood.",
        "Regulatory changes and compliance requirements create moderate exposure to this risk.",
        "Third-party dependency and contract terms analysis indicates possible but not certain occurrence."
    ],
    "technical": [
        "System architecture review and code quality assessments indicate moderate technical risk.",
        "Recent security audits and penetration testing revealed potential vulnerabilities.",
        "Legacy system dependencies and technical debt increase probability of occurrence.",
        "Infrastructure monitoring data shows intermittent issues that could escalate.",
        "Technology stack analysis and vendor support levels suggest moderate likelihood."
    ],
    "compliance": [
        "Regulatory landscape analysis indicates moderate probability of compliance issues.",
        "Recent audit findings and control testing results suggest some vulnerability.",
        "Industry best practices and peer organization experiences indicate possible occurrence.",
        "Policy implementation gaps and training effectiveness create moderate exposure.",
        "Regulatory change frequency and enforcement patterns suggest moderate likelihood."
    ],
    "security": [
        "Threat intelligence and security monitoring data indicate moderate risk level.",
        "Recent security assessments and vulnerability scans revealed potential exposure.",
        "Industry threat landscape and attack frequency data suggest possible occurrence.",
        "Current security controls and incident response capabilities provide moderate protection.",
        "Third-party security assessments and penetration testing indicate moderate vulnerability."
    ],
    "strategic": [
        "Market analysis and competitive intelligence suggest moderate strategic risk.",
        "Business environment assessment and stakeholder feedback indicate possible occurrence.",
        "Strategic planning assumptions and scenario analysis show moderate likelihood.",
        "Industry trends and market dynamics create moderate exposure to this risk.",
        "Organizational capabilities and resource allocation suggest moderate vulnerability."
    ]
}

IMPACT_BASIS_SAMPLES = {
    "operational": [
        "Impact assessment based on business continuity analysis and operational dependency mapping.",
        "Financial modeling indicates moderate operational disruption with potential revenue impact.",
        "Customer service metrics and stakeholder impact analysis suggest moderate severity.",
        "Process efficiency analysis and resource utilization impact assessment.",
        "Operational resilience testing and recovery time objectives indicate moderate impact."
    ],
    "financial": [
        "Financial impact modeling and budget variance analysis indicate moderate monetary exposure.",
        "Revenue impact assessment and cost-benefit analysis suggest moderate financial severity.",
        "Cash flow analysis and working capital impact evaluation.",
        "Investment portfolio analysis and financial risk exposure assessment.",
        "Regulatory fine potential and compliance cost analysis indicate moderate impact."
    ],
    "technical": [
        "System availability impact and technical debt analysis suggest moderate severity.",
        "Infrastructure cost analysis and technology replacement impact assessment.",
        "Data integrity and system performance impact evaluation.",
        "Technical support cost and maintenance impact analysis.",
        "Technology roadmap impact and innovation capability assessment."
    ],
    "compliance": [
        "Regulatory fine potential and compliance cost analysis indicate moderate impact.",
        "Reputational damage assessment and stakeholder confidence impact evaluation.",
        "Legal liability analysis and regulatory enforcement impact assessment.",
        "Business license and operational permit impact evaluation.",
        "Compliance program cost and resource impact analysis."
    ],
    "security": [
        "Data breach impact assessment and security incident cost analysis.",
        "Reputational damage and customer trust impact evaluation.",
        "Regulatory compliance impact and legal liability assessment.",
        "Business continuity impact and operational disruption analysis.",
        "Security remediation cost and system recovery impact assessment."
    ],
    "strategic": [
        "Strategic objective impact and business goal achievement assessment.",
        "Market position impact and competitive advantage evaluation.",
        "Stakeholder relationship impact and partnership assessment.",
        "Organizational capability impact and resource allocation analysis.",
        "Long-term growth impact and strategic initiative evaluation."
    ]
}

NOTES_SAMPLES = [
    "This risk requires ongoing monitoring and regular review of mitigation controls. Consider implementing additional safeguards if conditions change.",
    "Stakeholder communication plan has been developed to address potential impacts. Regular updates will be provided to management.",
    "Mitigation strategies are currently being implemented. Progress will be tracked through quarterly risk assessments.",
    "This risk is being actively managed through existing controls. No additional actions required at this time.",
    "Risk owner has been assigned and mitigation plan is in development. Next review scheduled for next quarter.",
    "Current controls appear adequate but should be tested regularly. Consider stress testing scenarios.",
    "Risk tolerance level has been established. Monitoring will continue with monthly status updates.",
    "Cross-functional team has been assembled to address this risk. Regular coordination meetings scheduled.",
    "External expert consultation has been obtained. Recommendations are being evaluated for implementation.",
    "Risk has been escalated to senior management for additional resource allocation and strategic guidance.",
    "Temporary controls have been implemented while permanent solutions are being developed.",
    "Risk assessment has been updated based on recent organizational changes and external factors.",
    "Training program has been developed to address knowledge gaps related to this risk area.",
    "Vendor risk assessment has been completed. Contract terms are being reviewed for risk mitigation.",
    "Business continuity plan has been updated to address this specific risk scenario."
]

def update_existing_risks():
    """Update existing risks with fake data"""
    
    # Use the exact same PostgreSQL connection as the backend
    db_url = "postgresql+psycopg://neondb_owner:3VjDpOhvNbICGa8yloD9Km5QY862DDEd9UY1EPApdfY@ep-old-rain-adwlsd2p-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
    
    print(f"Connecting to PostgreSQL database...")
    
    engine = create_engine(db_url)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # Get all existing risks
        risks = db.query(Risk).all()
        
        if not risks:
            print("No risks found in the database.")
            return
        
        print(f"Found {len(risks)} risks to update...")
        
        updated_count = 0
        
        for risk in risks:
            # Skip if already has data
            if risk.notes and risk.probability_basis and risk.impact_basis:
                print(f"Risk '{risk.risk_name}' already has data, skipping...")
                continue
            
            # Get category-specific samples
            category = risk.category or "operational"
            
            # Add probability basis if missing
            if not risk.probability_basis:
                risk.probability_basis = random.choice(PROBABILITY_BASIS_SAMPLES.get(category, PROBABILITY_BASIS_SAMPLES["operational"]))
            
            # Add impact basis if missing
            if not risk.impact_basis:
                risk.impact_basis = random.choice(IMPACT_BASIS_SAMPLES.get(category, IMPACT_BASIS_SAMPLES["operational"]))
            
            # Add notes if missing
            if not risk.notes:
                risk.notes = random.choice(NOTES_SAMPLES)
            
            # Update the timestamp
            risk.updated_at = datetime.now(timezone.utc)
            
            updated_count += 1
            print(f"Updated risk: {risk.risk_name}")
        
        # Commit all changes
        db.commit()
        
        print(f"\nSuccessfully updated {updated_count} risks with fake data:")
        print(f"- Added probability basis to risks missing this field")
        print(f"- Added impact basis to risks missing this field") 
        print(f"- Added notes to risks missing this field")
        
    except Exception as e:
        print(f"Error updating risks: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("Updating existing risks with fake data...")
    update_existing_risks()
    print("Done!")
