import { Col, Row } from "antd";
import { TitleInput } from "./components/project-title";
import styled from "styled-components";

const PageContainer = styled.div`
  padding: 20px;
`;

const ContentContainer = styled.div`
  margin-top: 20px;
`;

export const CompanyEditPage = () => {
  return (
    <PageContainer>
      <TitleInput />
      <ContentContainer>
        <Row gutter={[32, 32]}>
          {/* <Col span={16}> */}
          {/* <CompanyContactsTable /> <CompanyDealsTable style={{ marginTop: 32, }} /> <CompanyQuotesTable style={{ marginTop: 32, }} /> <CompanyNotes style={{ marginTop: 32, }} /> </Col> <Col span={8}> <CompanyInfoForm /> </Col> */}
        </Row>
      </ContentContainer>
    </PageContainer>
  );
};