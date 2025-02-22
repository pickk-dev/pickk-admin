import {forwardRef, useImperativeHandle, useState, Ref} from 'react';
import styled from 'styled-components';
import {PageHeader} from 'antd';
import {palette} from '@pickk/design-token';

import {
  BoardPreview,
  BoardFilter,
  BoardTable,
} from '@components/common/organisms';

import {parseRecordWithDeepKey, removeDashFromNumber} from '@common/helpers';

import {BoardTemplateProps, BoardTemplateHandle} from './board.type';

const StyledWrapper = styled.div`
  display: flex;
  flex-direction: column;

  min-height: 100vh;

  background-color: ${palette.gray1};
`;

const StyledPageHeader = styled(PageHeader)`
  margin-bottom: 1.2rem;

  background-color: ${palette.white};
`;

const DEFAULT_PAGE_SIZE = 20;

const BoardTemplate = forwardRef<BoardTemplateHandle, BoardTemplateProps>(
  (props: BoardTemplateProps, ref: Ref<BoardTemplateHandle>) => {
    const propsWithDefault: BoardTemplateProps = {
      ...props,
      defaultPageSize: DEFAULT_PAGE_SIZE,
    };

    const {
      title,
      subTitle,
      useBoardData,
      defaultFilter = {},
      filterInputs,
      previews,
      usePreviewData,
      defaultPageSize,
      onRowClick = () => null,
    } = propsWithDefault;

    const [filter, setFilter] =
      useState<Record<string, unknown>>(defaultFilter);
    const [query, setQuery] = useState(null);

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(defaultPageSize);

    const {
      data = [],
      total,
      loading,
      refetch,
    } = useBoardData({
      pageInput: {
        offset: (page - 1) * pageSize,
        limit: pageSize,
      },
      filter,
      ...(query ? {query} : {}),
    });

    const useExcelData = () =>
      useBoardData({
        pageInput: {
          offset: 0,
          limit: total,
        },
        filter,
        ...(query ? {query} : {}),
      });

    const reload = async () => {
      await refetch();
    };

    useImperativeHandle(ref, () => ({
      reload,
    }));

    const formatFilter = (
      inputs: Record<string, unknown>,
    ): Record<string, unknown> => {
      let result = {...inputs};

      /**  조회 기간 필터를 형식에 맞게 변경한다. */
      const datePeriodFilter = inputs.period;
      result = {
        ...result,
        ...(datePeriodFilter
          ? {
              ...parseRecordWithDeepKey(
                datePeriodFilter['lookup'],
                datePeriodFilter['range'],
              ),
            }
          : {}),
      };
      delete result['period'];

      /**  검색어가 숫자와 '-'의 조합인 경우 '-' 를 제거한다.  */
      result = {
        ...result,
        ...(result['search']
          ? {search: removeDashFromNumber(result['search'] as string)}
          : {}),
        ...(result['query']
          ? {query: removeDashFromNumber(result['query'] as string)}
          : {}),
      };

      return result;
    };

    const handleFilterChange = (newFilter: Record<string, unknown>) => {
      const formattedFilter = formatFilter(newFilter);

      /** query 필드는 filter에서 제외한다. */
      setQuery(formattedFilter.query ?? null);
      delete formattedFilter.query;

      setFilter(formattedFilter);

      /** 첫페이지 초기화 */
      setPage(1);
    };

    if (!data && !loading) {
      return null;
    }

    return (
      <StyledWrapper>
        <StyledPageHeader title={title} subTitle={subTitle} />
        {!!previews && !!usePreviewData && (
          <BoardPreview
            previews={previews}
            usePreviewData={usePreviewData}
            filter={filter}
            onPreviewClick={handleFilterChange}
          />
        )}
        {!!filterInputs && (
          <BoardFilter
            defaultFilter={filter}
            onFilterChange={handleFilterChange}
            inputs={filterInputs}
          />
        )}
        <BoardTable
          {...propsWithDefault}
          dataSource={data}
          totalDataSize={total}
          loading={loading}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          onRefreshClick={reload}
          onRowClick={onRowClick}
          useExcelData={useExcelData}
        />
      </StyledWrapper>
    );
  },
);

export default BoardTemplate;
