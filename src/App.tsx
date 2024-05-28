import { Authenticated, Refine } from "@refinedev/core";
import { DevtoolsPanel, DevtoolsProvider } from "@refinedev/devtools";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";

import {
  AuthPage,
  ErrorComponent,
  ThemedLayoutV2,
  ThemedSiderV2,
  useNotificationProvider,
} from "@refinedev/antd";
import "@refinedev/antd/dist/reset.css";

import routerBindings, {
  CatchAllNavigate,
  DocumentTitleHandler,
  NavigateToResource,
  UnsavedChangesNotifier,
} from "@refinedev/react-router-v6";

import { dataProvider, liveProvider } from "@refinedev/supabase";
import { App as AntdApp } from "antd";
import { BrowserRouter, Outlet, Route, Routes } from "react-router-dom";
// import { Header } from "./components/header";
import { ColorModeContextProvider } from "./contexts/color-mode";
import {
  BlogPostCreate,
  BlogPostEdit,
  BlogPostList,
  BlogPostShow,
} from "./pages/blog-posts";

import { supabaseClient } from "./utility";
import { GoogleOutlined } from "@ant-design/icons";
import { authProvider } from "./authProvider";
import { Layout } from "./components/layout";
import { resources } from "./resources";
import { CheckCompanyStatus } from "./pages/company/checkCompanyStatus";
import { JoinCompany } from "./pages/company/joinCompany";
import { accessControlProvider } from "./providers/accessControlProvider";
import { SettingsPage } from "./pages/administration";
import {  TaskCreate, KanbanPage, KanbanCreateCategory, KanbanEditCategory, KanbanEditPage } from "./pages/task";
import {  InventoryCreate, InventoryList } from "./pages/inventory";
import { ProjectMemberList } from "./pages/attendance/list";
import { ProjectTaskCreate } from "./pages/blog-posts/components/tasks/taskcreate";
import { ProjectTaskEdit } from "./pages/blog-posts/components/tasks/taskedit";



const MyTitle = ({ collapsed }: { collapsed: boolean }) => {
  if (collapsed) {
    return <h2>PX</h2>
  }

  return <h2>PMOX</h2>
}


function App() {
  return (
    <BrowserRouter>
      <RefineKbarProvider>
          <AntdApp>
            <DevtoolsProvider>
              <Refine
                dataProvider={dataProvider(supabaseClient)}
                liveProvider={liveProvider(supabaseClient)}
                authProvider={authProvider}
                routerProvider={routerBindings}
                accessControlProvider={accessControlProvider}
                notificationProvider={useNotificationProvider}
                resources={resources}
                options={{
                  syncWithLocation: true,
                  warnWhenUnsavedChanges: true,
                  useNewQueryKeys: true,
                  projectId: "OMrjoO-mBGCxY-dgOyzV",
                }}
              >
                <Routes>
                  <Route
                    element={
                      <Authenticated
                        key="authenticated-la"
                        fallback={<CatchAllNavigate to="/login" />}
                      >
                        <Layout>
                        <CheckCompanyStatus />
                      </Layout>
                    </Authenticated>
                      
                    }
                  >
                    <Route
                      index
                      element={<NavigateToResource resource="blog_posts" />}
                    />
                    <Route path="/blog-posts">
                      <Route index element={<BlogPostList />} />
                      <Route path="create" element={<BlogPostCreate />} />
                      <Route path="edit/:id" element={<BlogPostEdit />} />
                      <Route path="show/:id" element={<BlogPostShow />} />
                    </Route>
                    <Route path="/administration" element={<Outlet />}>
                      <Route path="settings" element={<SettingsPage />} />
                      {/* <Route path="audit-log" element={<AuditLogPage />} /> */}
                    </Route>

                    <Route path="/task" element={<KanbanPage />}>
                    
                        
                      
                      {/* <Route path="audit-log" element={<ProjectTaskEdit/>} /> */}
                    </Route>
                  
                    <Route path="/task/create" element={<TaskCreate />} />
                    <Route path="/blog-posts/show/:id/create" element={<ProjectTaskCreate />} />
                    <Route path="/blog-posts/show/edit/:id" element={<ProjectTaskEdit />} />
                    <Route path="/task/edit/:id" element={<KanbanEditPage />} />
                    <Route
                          path="/task/category/create"
                          element={<KanbanCreateCategory />}
                        />
                        <Route
                          path="/task/category/edit/:id"
                          element={<KanbanEditCategory />}
                        />
                      
                        <Route path="/inventory">
                            <Route index element={<InventoryList />} />
                            <Route path="create" element={<InventoryCreate />} />
                         
                      </Route>
                      <Route path="/attendance" element={<ProjectMemberList />}>

                      </Route>
                    <Route path="*" element={<ErrorComponent />} />
                  </Route>
                  <Route path="joinCompany" element={<JoinCompany />} />
                  <Route
                    element={
                      <Authenticated
                        key="authenticated-outer"
                        fallback={<Outlet />}
                      >
                        <NavigateToResource />
                      </Authenticated>
                    }
                  >
                   <Route
                path="/login"
                element={
                  <AuthPage
                    type="login"
                    providers={[
                      {
                        name: "google",
                        label: "Sign in with Google",
                        icon: (
                          <GoogleOutlined
                            style={{
                              fontSize: 18,
                              lineHeight: 0,
                            }}
                          />
                        ),
                      },
                    ]}
                  />
                }
              />
                  </Route>
                </Routes>
                <RefineKbar />
                <UnsavedChangesNotifier />
                <DocumentTitleHandler />
              </Refine>
              <DevtoolsPanel />
            </DevtoolsProvider>
          </AntdApp>
      </RefineKbarProvider>
    </BrowserRouter>
  );
}

export default App;
