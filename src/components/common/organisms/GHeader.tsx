import styled from 'styled-components';
import {useRouter} from 'next/router';
import {Layout, Avatar, Dropdown, Menu, Typography, message} from 'antd';
import {DownOutlined, UserOutlined} from '@ant-design/icons';
import {palette} from '@pickk/design-token';

import {PickLogoIcon} from '../icons';

import {removeCookie} from '@src/common/helpers';

const {Title} = Typography;
const {Header} = Layout;

export default function GHeader() {
  const router = useRouter();

  const signOut = async () => {
    try {
      if (confirm('로그아웃 하시겠습니까?')) {
        message.success('로그아웃 되었습니다.');

        removeCookie('accessToken');
        removeCookie('refreshToken');

        router.reload(); /** clear apollo cache store */
        router.push('/login');
      }
    } catch (error) {
      message.error('실패했습니다. err - ' + error);
    }
  };

  const dropDownMenu = (
    <Menu style={{width: 90, fontWeight: 300}}>
      <Menu.Item key="0" onClick={() => router.push('/mypage/edit')}>
        내 정보
      </Menu.Item>
      <Menu.Item key="1" onClick={signOut}>
        로그아웃
      </Menu.Item>
    </Menu>
  );

  return (
    <StyledHeader>
      <a href="https://pickk.one" target="_blank" rel="noreferrer">
        <PickLogoIcon style={{width: '4rem'}} fill={palette.white} />
      </a>
      <StyleTitle onClick={() => router.push('/dashboard')}>
        스토어 어드민
      </StyleTitle>
      <StyledDropdown overlay={dropDownMenu} trigger={['click']}>
        <a href="#" style={{color: palette.white}}>
          <Avatar shape="square" icon={<UserOutlined />} size="small" />
          <DownOutlined style={{marginLeft: '0.6rem'}} />
        </a>
      </StyledDropdown>
    </StyledHeader>
  );
}

const StyledHeader = styled(Header)`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0 1.2rem;
`;

const StyleTitle = styled(Title).attrs({
  level: 3,
  style: {
    color: palette.white,
    margin: 0,
    marginLeft: '0.8rem',
  },
})``;

const StyledDropdown = styled(Dropdown)`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-left: auto;
`;
